const axios = require("axios");
const Prediction = require("../models/Prediction");
const Customer = require("../models/Customer");
const ActivityLog = require("../models/ActivityLog");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * POST /api/predictions/predict
 * Calls ML service, saves prediction, optionally updates customer
 */
exports.predict = async (req, res, next) => {
  try {
    const { customerId, saveToCustomer = false, ...featureData } = req.body;

    // Call FastAPI ML service
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, featureData, {
      timeout: 30000,
    });

    const mlResult = mlResponse.data;

    // Build prediction document
    let customerRef = null;
    if (customerId) {
      customerRef = await Customer.findById(customerId);
    }

    const prediction = await Prediction.create({
      customerId: customerRef?._id || null,
      customerIdString: customerRef?.customerId || null,
      modelUsed: mlResult.model_used,
      churnProbability: mlResult.churn_probability,
      noChurnProbability: mlResult.no_churn_probability,
      riskLevel: mlResult.risk_level,
      confidence: mlResult.confidence,
      inputFeatures: featureData,
      explanations: mlResult.explanations,
      recommendations: mlResult.recommendations,
      status: "completed",
    });

    // Update customer record if requested
    if (customerRef && saveToCustomer) {
      await Customer.findByIdAndUpdate(customerRef._id, {
        churnProbability: mlResult.churn_probability,
        riskLevel: mlResult.risk_level,
        lastPredictionAt: new Date(),
      });
    }

    // Log activity
    await ActivityLog.create({
      action: "PREDICTION_MADE",
      entityType: "Prediction",
      entityId: prediction._id,
      metadata: {
        riskLevel: mlResult.risk_level,
        churnProbability: mlResult.churn_probability,
        modelUsed: mlResult.model_used,
      },
    });

    res.status(201).json({
      predictionId: prediction._id,
      ...mlResult,
    });
  } catch (error) {
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return res.status(503).json({
        error: "ML Service unavailable",
        detail: "The Python prediction service is not running. Start it with: uvicorn main:app",
      });
    }
    if (axios.isAxiosError(error)) {
      return res.status(502).json({
        error: "ML Service error",
        detail: error.response?.data?.detail || error.message,
      });
    }
    next(error);
  }
};

/**
 * POST /api/predictions/simulate
 * Forwards What-If simulation request to FastAPI
 */
exports.simulate = async (req, res, next) => {
  try {
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/simulate`, req.body, {
      timeout: 15000,
    });
    res.json(mlResponse.data);
  } catch (error) {
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return res.status(503).json({
        error: "ML Service unavailable",
        detail: "Start the ML microservice on port 8000.",
      });
    }
    if (axios.isAxiosError(error)) {
      return res.status(502).json({
        error: "ML Service error",
        detail: error.response?.data?.detail || error.message,
      });
    }
    next(error);
  }
};

/**
 * GET /api/predictions/history
 */
exports.getHistory = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      riskLevel,
      modelUsed,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};
    if (riskLevel) query.riskLevel = riskLevel;
    if (modelUsed) query.modelUsed = modelUsed;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [predictions, total] = await Promise.all([
      Prediction.find(query)
        .populate("customerId", "customerId gender contract")
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Prediction.countDocuments(query),
    ]);

    res.json({
      predictions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/predictions/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const prediction = await Prediction.findById(req.params.id)
      .populate("customerId")
      .lean();
    if (!prediction) {
      return res.status(404).json({ error: "Prediction not found" });
    }
    res.json(prediction);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/predictions/:id
 */
exports.remove = async (req, res, next) => {
  try {
    const prediction = await Prediction.findByIdAndDelete(req.params.id);
    if (!prediction) {
      return res.status(404).json({ error: "Prediction not found" });
    }
    res.json({ message: "Prediction deleted successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/predictions/stats
 */
exports.getStats = async (req, res, next) => {
  try {
    const stats = await Prediction.aggregate([
      {
        $group: {
          _id: "$riskLevel",
          count: { $sum: 1 },
          avgProbability: { $avg: "$churnProbability" },
        },
      },
    ]);

    const modelStats = await Prediction.aggregate([
      {
        $group: {
          _id: "$modelUsed",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ riskLevelStats: stats, modelStats });
  } catch (error) {
    next(error);
  }
};
