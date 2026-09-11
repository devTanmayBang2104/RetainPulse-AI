const Customer = require("../models/Customer");
const Prediction = require("../models/Prediction");
const ActivityLog = require("../models/ActivityLog");

/**
 * GET /api/dashboard/stats
 * Returns KPI cards for the dashboard
 */
exports.getStats = async (req, res, next) => {
  try {
    const [
      totalCustomers,
      highRisk,
      mediumRisk,
      lowRisk,
      totalPredictions,
      todayPredictions,
    ] = await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments({ riskLevel: "HIGH" }),
      Customer.countDocuments({ riskLevel: "MEDIUM" }),
      Customer.countDocuments({ riskLevel: "LOW" }),
      Prediction.countDocuments(),
      Prediction.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),
    ]);

    // Average churn probability
    const avgChurnAgg = await Customer.aggregate([
      { $match: { churnProbability: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: "$churnProbability" } } },
    ]);
    const avgChurnProbability = avgChurnAgg[0]?.avg ?? 0;

    // Revenue at risk (high risk customers' monthly charges)
    const revenueAtRisk = await Customer.aggregate([
      { $match: { riskLevel: "HIGH" } },
      { $group: { _id: null, total: { $sum: "$monthlyCharges" } } },
    ]);

    // Active customers = those not churned
    const activeCustomers = await Customer.countDocuments({ isChurned: false });

    res.json({
      totalCustomers,
      activeCustomers,
      highRiskCustomers: highRisk,
      mediumRiskCustomers: mediumRisk,
      lowRiskCustomers: lowRisk,
      avgChurnProbability: parseFloat(avgChurnProbability.toFixed(4)),
      revenueAtRisk: revenueAtRisk[0]?.total ?? 0,
      totalPredictions,
      todayPredictions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/charts
 * Returns chart data for dashboard visualizations
 */
exports.getCharts = async (req, res, next) => {
  try {
    // Churn distribution
    const churnDist = await Customer.aggregate([
      { $match: { riskLevel: { $ne: null } } },
      { $group: { _id: "$riskLevel", count: { $sum: 1 } } },
    ]);

    // Contract type distribution
    const contractDist = await Customer.aggregate([
      { $group: { _id: "$contract", count: { $sum: 1 } } },
    ]);

    // Internet service distribution
    const internetDist = await Customer.aggregate([
      { $group: { _id: "$internetService", count: { $sum: 1 } } },
    ]);

    // Monthly charges buckets
    const chargesBuckets = await Customer.aggregate([
      {
        $bucket: {
          groupBy: "$monthlyCharges",
          boundaries: [0, 25, 50, 75, 100, 125],
          default: "125+",
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    // Prediction trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const predictionTrend = await Prediction.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
          highRisk: {
            $sum: { $cond: [{ $eq: ["$riskLevel", "HIGH"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Recent activity
    const recentActivity = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      churnDistribution: churnDist.map((d) => ({
        name: d._id,
        value: d.count,
      })),
      contractDistribution: contractDist.map((d) => ({
        name: d._id,
        count: d.count,
      })),
      internetDistribution: internetDist.map((d) => ({
        name: d._id,
        count: d.count,
      })),
      chargesDistribution: chargesBuckets,
      predictionTrend,
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};
