const Customer = require("../models/Customer");
const ActivityLog = require("../models/ActivityLog");

/**
 * GET /api/customers
 * List all customers with search, filter, sort, pagination
 */
exports.getAll = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      riskLevel,
      contract,
      internetService,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { customerId: { $regex: search, $options: "i" } },
        { gender: { $regex: search, $options: "i" } },
        { contract: { $regex: search, $options: "i" } },
      ];
    }
    if (riskLevel) query.riskLevel = riskLevel;
    if (contract) query.contract = contract;
    if (internetService) query.internetService = internetService;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Customer.countDocuments(query),
    ]);

    res.json({
      customers,
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
 * GET /api/customers/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/customers
 */
exports.create = async (req, res, next) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();

    await ActivityLog.create({
      action: "CUSTOMER_ADDED",
      entityType: "Customer",
      entityId: customer._id,
      metadata: { customerId: customer.customerId },
    });

    res.status(201).json(customer);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Customer ID already exists" });
    }
    next(error);
  }
};

/**
 * PUT /api/customers/:id
 */
exports.update = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    await ActivityLog.create({
      action: "CUSTOMER_UPDATED",
      entityType: "Customer",
      entityId: customer._id,
      metadata: { customerId: customer.customerId, updatedFields: Object.keys(req.body) },
    });

    res.json(customer);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/customers/:id
 */
exports.remove = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    await ActivityLog.create({
      action: "CUSTOMER_DELETED",
      entityType: "Customer",
      entityId: customer._id,
      metadata: { customerId: customer.customerId },
    });

    res.json({ message: "Customer deleted successfully", customerId: customer.customerId });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/customers/high-risk
 */
exports.getHighRisk = async (req, res, next) => {
  try {
    const customers = await Customer.find({ riskLevel: "HIGH" })
      .sort({ churnProbability: -1 })
      .limit(20)
      .lean();
    res.json(customers);
  } catch (error) {
    next(error);
  }
};
