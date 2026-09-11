/**
 * Telecom Retention Platform — Express Server
 * Entry point for the Node.js backend
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./src/config/db");
const errorHandler = require("./src/middleware/errorHandler");

// Route imports
const dashboardRoutes = require("./src/routes/dashboard");
const customerRoutes = require("./src/routes/customers");
const predictionRoutes = require("./src/routes/predictions");
const analyticsRoutes = require("./src/routes/analytics");
const reportRoutes = require("./src/routes/reports");
const aiRoutes = require("./src/routes/ai");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { error: "Too many requests, please try again later." }
});
app.use("/api/", limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "RetainPulse AI Backend",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development"
  });
});

// API Routes
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/ai", aiRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// Centralized error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🗄️  MongoDB: ${process.env.MONGO_URI ? "Configured" : "Default"}`);
  console.log(`🤖 ML Service: ${process.env.ML_SERVICE_URL || "http://localhost:8000"}\n`);
});

module.exports = app;
