const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const CustomerSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      default: () => `CUST-${uuidv4().slice(0, 8).toUpperCase()}`,
      unique: true,
      index: true,
    },
    // Demographics
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },
    seniorCitizen: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    partner: {
      type: String,
      enum: ["Yes", "No"],
      required: true,
    },
    dependents: {
      type: String,
      enum: ["Yes", "No"],
      required: true,
    },
    // Account
    tenure: {
      type: Number,
      min: 0,
      max: 72,
      required: true,
    },
    contract: {
      type: String,
      enum: ["Month-to-month", "One year", "Two year"],
      required: true,
    },
    paperlessBilling: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    paymentMethod: {
      type: String,
      enum: [
        "Electronic check",
        "Mailed check",
        "Bank transfer (automatic)",
        "Credit card (automatic)",
      ],
      required: true,
    },
    monthlyCharges: {
      type: Number,
      min: 0,
      max: 200,
      required: true,
    },
    totalCharges: {
      type: Number,
      min: 0,
      default: 0,
    },
    // Services
    phoneService: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },
    multipleLines: {
      type: String,
      enum: ["Yes", "No", "No phone service"],
      default: "No",
    },
    internetService: {
      type: String,
      enum: ["DSL", "Fiber optic", "No"],
      required: true,
    },
    onlineSecurity: {
      type: String,
      enum: ["Yes", "No", "No internet service"],
      default: "No",
    },
    onlineBackup: {
      type: String,
      enum: ["Yes", "No", "No internet service"],
      default: "No",
    },
    deviceProtection: {
      type: String,
      enum: ["Yes", "No", "No internet service"],
      default: "No",
    },
    techSupport: {
      type: String,
      enum: ["Yes", "No", "No internet service"],
      default: "No",
    },
    streamingTV: {
      type: String,
      enum: ["Yes", "No", "No internet service"],
      default: "No",
    },
    streamingMovies: {
      type: String,
      enum: ["Yes", "No", "No internet service"],
      default: "No",
    },
    // Churn status (from ML prediction or known label)
    churnProbability: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    riskLevel: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW", null],
      default: null,
    },
    isChurned: {
      type: Boolean,
      default: false,
    },
    lastPredictionAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
CustomerSchema.index({ riskLevel: 1 });
CustomerSchema.index({ contract: 1 });
CustomerSchema.index({ internetService: 1 });
CustomerSchema.index({ churnProbability: -1 });
CustomerSchema.index({ createdAt: -1 });

// Virtual: monthly revenue segment
CustomerSchema.virtual("revenueSegment").get(function () {
  if (this.monthlyCharges >= 80) return "High Value";
  if (this.monthlyCharges >= 45) return "Mid Value";
  return "Low Value";
});

module.exports = mongoose.model("Customer", CustomerSchema);
