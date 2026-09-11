const express = require("express");
const router = express.Router();
const Prediction = require("../models/Prediction");
const Customer = require("../models/Customer");
const ActivityLog = require("../models/ActivityLog");

/**
 * GET /api/reports/export/predictions
 * Export prediction history as CSV
 */
router.get("/export/predictions", async (req, res, next) => {
  try {
    const { riskLevel, startDate, endDate } = req.query;
    const query = {};
    if (riskLevel) query.riskLevel = riskLevel;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const limitNum = req.query.limit ? parseInt(req.query.limit) : 0; // 0 = no limit, export all

    let queryBuilder = Prediction.find(query).sort({ createdAt: -1 });
    if (limitNum > 0) queryBuilder = queryBuilder.limit(limitNum);
    const predictions = await queryBuilder.lean();

    const csv = _toCsv(predictions.map(p => ({
      "Prediction ID": p._id,
      "Customer ID": p.customerIdString || "N/A",
      "Model": p.modelUsed,
      "Churn Probability": (p.churnProbability * 100).toFixed(2) + "%",
      "Risk Level": p.riskLevel,
      "Confidence": (p.confidence * 100).toFixed(2) + "%",
      "Top Reason": p.explanations?.[0]?.message || "N/A",
      "Top Recommendation": p.recommendations?.[0]?.title || "N/A",
      "Date": new Date(p.createdAt).toLocaleString(),
    })));

    await ActivityLog.create({
      action: "REPORT_GENERATED",
      entityType: "Report",
      metadata: { type: "predictions_csv", count: predictions.length },
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="predictions_report_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/export/customers
 */
router.get("/export/customers", async (req, res, next) => {
  try {
    const { riskLevel, limit } = req.query;
    const query = {};
    if (riskLevel) query.riskLevel = riskLevel;

    const limitNum = limit ? parseInt(limit) : 0; // 0 = no limit, export all 7043 customers

    let queryBuilder = Customer.find(query).sort({ churnProbability: -1 });
    if (limitNum > 0) queryBuilder = queryBuilder.limit(limitNum);
    const customers = await queryBuilder.lean();

    const csv = _toCsv(customers.map(c => ({
      "Customer ID": c.customerId,
      "Gender": c.gender,
      "Senior Citizen": c.seniorCitizen ? "Yes" : "No",
      "Partner": c.partner,
      "Dependents": c.dependents,
      "Tenure (Months)": c.tenure,
      "Contract": c.contract,
      "Internet Service": c.internetService,
      "Monthly Charges": "$" + c.monthlyCharges,
      "Churn Probability": c.churnProbability != null ? (c.churnProbability * 100).toFixed(2) + "%" : "N/A",
      "Risk Level": c.riskLevel || "Not Assessed",
      "Added On": new Date(c.createdAt).toLocaleDateString(),
    })));

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="customers_report_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/summary
 */
router.get("/summary", async (req, res, next) => {
  try {
    const [totalCustomers, totalPredictions, highRisk, revenueAtRisk] = await Promise.all([
      Customer.countDocuments(),
      Prediction.countDocuments(),
      Customer.countDocuments({ riskLevel: "HIGH" }),
      Customer.aggregate([
        { $match: { riskLevel: "HIGH" } },
        { $group: { _id: null, total: { $sum: "$monthlyCharges" } } },
      ]),
    ]);

    res.json({
      generatedAt: new Date().toISOString(),
      totalCustomers,
      totalPredictions,
      highRiskCustomers: highRisk,
      estimatedMonthlyRevenueAtRisk: revenueAtRisk[0]?.total ?? 0,
      estimatedAnnualRevenueAtRisk: (revenueAtRisk[0]?.total ?? 0) * 12,
    });
  } catch (error) {
    next(error);
  }
});

function _toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map(row =>
      headers.map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ];
  return lines.join("\n");
}

module.exports = router;
