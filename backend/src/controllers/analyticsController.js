const Customer = require("../models/Customer");
const Prediction = require("../models/Prediction");

/**
 * GET /api/analytics
 * Full analytics data for the analytics page
 */
exports.getAnalytics = async (req, res, next) => {
  try {
    const [
      churnByGender,
      churnBySenior,
      churnByContract,
      churnByInternet,
      churnByPayment,
      revenueByRisk,
      predictionsByDay,
    ] = await Promise.all([
      // Churn by gender
      Customer.aggregate([
        { $match: { riskLevel: { $ne: null } } },
        { $group: { _id: { gender: "$gender", risk: "$riskLevel" }, count: { $sum: 1 } } },
      ]),

      // Churn by senior citizen
      Customer.aggregate([
        { $match: { riskLevel: { $ne: null } } },
        { $group: { _id: { senior: "$seniorCitizen", risk: "$riskLevel" }, count: { $sum: 1 } } },
      ]),

      // Churn by contract
      Customer.aggregate([
        { $match: { riskLevel: { $ne: null } } },
        { $group: { _id: { contract: "$contract", risk: "$riskLevel" }, count: { $sum: 1 } } },
      ]),

      // Churn by internet service
      Customer.aggregate([
        { $match: { riskLevel: { $ne: null } } },
        { $group: { _id: { internet: "$internetService", risk: "$riskLevel" }, count: { $sum: 1 } } },
      ]),

      // Churn by payment method
      Customer.aggregate([
        { $match: { riskLevel: { $ne: null } } },
        { $group: { _id: { payment: "$paymentMethod", risk: "$riskLevel" }, count: { $sum: 1 } } },
      ]),

      // Revenue by risk level
      Customer.aggregate([
        { $match: { riskLevel: { $ne: null } } },
        {
          $group: {
            _id: "$riskLevel",
            totalRevenue: { $sum: "$monthlyCharges" },
            avgRevenue: { $avg: "$monthlyCharges" },
            count: { $sum: 1 },
          },
        },
      ]),

      // Predictions by day (last 30 days)
      Prediction.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: 1 },
            high: { $sum: { $cond: [{ $eq: ["$riskLevel", "HIGH"] }, 1, 0] } },
            medium: { $sum: { $cond: [{ $eq: ["$riskLevel", "MEDIUM"] }, 1, 0] } },
            low: { $sum: { $cond: [{ $eq: ["$riskLevel", "LOW"] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Format churn by gender
    const genderData = _pivotRiskData(churnByGender, "gender");
    const seniorData = _pivotRiskData(churnBySenior, "senior");
    const contractData = _pivotRiskData(churnByContract, "contract");
    const internetData = _pivotRiskData(churnByInternet, "internet");
    const paymentData = _pivotRiskData(churnByPayment, "payment");

    res.json({
      churnByGender: genderData,
      churnBySeniorCitizen: seniorData,
      churnByContract: contractData,
      churnByInternetService: internetData,
      churnByPaymentMethod: paymentData,
      revenueByRisk,
      predictionTrend: predictionsByDay,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Pivot risk level counts by a given key
 */
function _pivotRiskData(data, key) {
  const map = {};
  data.forEach(({ _id, count }) => {
    const cat = String(_id[key]);
    if (!map[cat]) map[cat] = { name: cat, HIGH: 0, MEDIUM: 0, LOW: 0 };
    map[cat][_id.risk] = count;
  });
  return Object.values(map);
}
