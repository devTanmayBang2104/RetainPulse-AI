const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema(
  {
    // Reference to customer (optional — can predict without saving customer)
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },
    customerIdString: {
      type: String,
      default: null,
    },
    // Model used
    modelUsed: {
      type: String,
      enum: ["logistic_regression", "random_forest", "xgboost"],
      default: "random_forest",
    },
    // Prediction results
    churnProbability: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    noChurnProbability: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    riskLevel: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    // Input features snapshot
    inputFeatures: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    // SHAP/rule explanations
    explanations: [
      {
        feature: String,
        shap_value: Number,
        direction: String,
        impact: String,
        message: String,
      },
    ],
    // Business recommendations
    recommendations: [
      {
        id: String,
        title: String,
        description: String,
        category: String,
        priority: String,
        estimated_impact: String,
        action: String,
      },
    ],
    // Status
    status: {
      type: String,
      enum: ["completed", "failed", "pending"],
      default: "completed",
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PredictionSchema.index({ createdAt: -1 });
PredictionSchema.index({ riskLevel: 1 });
PredictionSchema.index({ churnProbability: -1 });

module.exports = mongoose.model("Prediction", PredictionSchema);
