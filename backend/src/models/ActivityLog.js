const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "PREDICTION_MADE",
        "CUSTOMER_ADDED",
        "CUSTOMER_UPDATED",
        "CUSTOMER_DELETED",
        "REPORT_GENERATED",
        "BULK_IMPORT",
      ],
    },
    entityType: {
      type: String,
      enum: ["Customer", "Prediction", "Report"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ action: 1 });

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);
