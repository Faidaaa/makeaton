const { Plan, Product } = require('../models');

// Helper to normalize plan fields (e.g. availableFrom/startDate, autoCloseOnEnd/autoCloseAtEnd)
const normalizePlan = (doc, productMap = {}) => {
  if (!doc) return doc;
  const p = { ...doc };
  p.availableFrom = p.availableFrom || p.startDate || p.createdAt;
  p.availableTo = p.availableTo || p.endDate || null;
  p.startDate = p.startDate || p.availableFrom;
  p.endDate = p.endDate || p.availableTo;
  p.autoCloseOnEnd = p.autoCloseOnEnd !== undefined ? p.autoCloseOnEnd : Boolean(p.autoCloseAtEnd);
  p.autoCloseAtEnd = p.autoCloseOnEnd;

  if (p.productId && productMap[String(p.productId)]) {
    p.product = productMap[String(p.productId)];
  }
  return p;
};

// GET /api/admin/plans and /api/plans
exports.getAll = async (req, res) => {
  try {
    const { search, name, frequency, billingFrequency, isActive, page, limit } = req.query;

    const filter = {};

    // Search by plan name
    const searchTerm = (search || name || '').trim();
    if (searchTerm) {
      filter.name = { $regex: searchTerm, $options: 'i' };
    }

    // Filter by frequency
    const freq = frequency || billingFrequency;
    if (freq && freq !== 'all') {
      filter.billingFrequency = freq;
    }

    // Filter by active state
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    } else if (!req.baseUrl?.includes('/admin') && !req.path?.includes('/admin')) {
      filter.isActive = true;
    }

    // Pagination support
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = parseInt(limit, 10);
    const isPaginated = !isNaN(limitNum) && limitNum > 0;

    let pagination = null;
    if (isPaginated) {
      pagination = {
        skip: (pageNum - 1) * limitNum,
        limit: limitNum
      };
    }

    const total = await Plan.countDocuments(filter);
    const rawPlans = await Plan.find(filter, { createdAt: -1 }, pagination);

    // Populate products
    const products = await Product.find();
    const productMap = {};
    products.forEach(p => { productMap[String(p._id)] = p; });

    const plans = rawPlans.map(p => normalizePlan(p, productMap));

    return res.json({
      success: true,
      count: plans.length,
      total,
      page: isPaginated ? pageNum : 1,
      totalPages: isPaginated ? Math.ceil(total / limitNum) || 1 : 1,
      plans
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve plans',
      error: err.message
    });
  }
};

// GET /api/admin/plans/:id and /api/plans/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Invalid plan ID' });
    }

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const product = plan.productId ? await Product.findById(plan.productId) : null;
    const productMap = product ? { [String(product._id)]: product } : {};

    return res.json({
      success: true,
      plan: normalizePlan(plan, productMap)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch plan',
      error: err.message
    });
  }
};

// POST /api/admin/plans and /api/plans
exports.create = async (req, res) => {
  try {
    const {
      name,
      productId,
      billingFrequency,
      cost,
      minQuantity,
      availableFrom,
      availableTo,
      startDate,
      endDate,
      autoCloseOnEnd,
      autoCloseAtEnd,
      allowEarlyClose,
      allowPause,
      allowRenewal
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Plan name is required.'
      });
    }

    if (cost === undefined || cost === null || cost === '') {
      return res.status(400).json({
        success: false,
        message: 'Plan recurring cost is required.'
      });
    }

    const numericCost = Number(cost);
    if (isNaN(numericCost) || numericCost < 0) {
      return res.status(400).json({
        success: false,
        message: 'Plan recurring cost must be a valid non-negative number.'
      });
    }

    const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];
    if (!billingFrequency || !validFrequencies.includes(billingFrequency)) {
      return res.status(400).json({
        success: false,
        message: `Invalid billing frequency. Must be one of: ${validFrequencies.join(', ')}`
      });
    }

    const minQty = Math.max(1, parseInt(minQuantity, 10) || 1);

    const fromDate = availableFrom ? new Date(availableFrom) : (startDate ? new Date(startDate) : new Date());
    const toDate = availableTo ? new Date(availableTo) : (endDate ? new Date(endDate) : null);

    const autoClose = autoCloseOnEnd !== undefined ? Boolean(autoCloseOnEnd) : Boolean(autoCloseAtEnd);

    const plan = await Plan.create({
      name: name.trim(),
      productId: productId || null,
      billingFrequency,
      cost: numericCost,
      minQuantity: minQty,
      availableFrom: fromDate,
      availableTo: toDate,
      startDate: fromDate,
      endDate: toDate,
      autoCloseOnEnd: autoClose,
      autoCloseAtEnd: autoClose,
      allowEarlyClose: allowEarlyClose !== undefined ? Boolean(allowEarlyClose) : true,
      allowPause: allowPause !== undefined ? Boolean(allowPause) : true,
      allowRenewal: allowRenewal !== undefined ? Boolean(allowRenewal) : true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const product = plan.productId ? await Product.findById(plan.productId) : null;
    const productMap = product ? { [String(product._id)]: product } : {};

    return res.status(201).json({
      success: true,
      message: `Plan '${plan.name}' created with ${plan.billingFrequency} cadence.`,
      plan: normalizePlan(plan, productMap)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create plan',
      error: err.message
    });
  }
};

// PUT /api/admin/plans/:id and /api/plans/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Invalid plan ID' });
    }

    const existing = await Plan.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const updateData = { updatedAt: new Date() };
    const {
      name,
      productId,
      billingFrequency,
      cost,
      minQuantity,
      availableFrom,
      availableTo,
      startDate,
      endDate,
      autoCloseOnEnd,
      autoCloseAtEnd,
      allowEarlyClose,
      allowPause,
      allowRenewal,
      isActive
    } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Plan name cannot be empty.' });
      }
      updateData.name = name.trim();
    }

    if (cost !== undefined) {
      const c = Number(cost);
      if (isNaN(c) || c < 0) {
        return res.status(400).json({ success: false, message: 'Plan cost must be a valid non-negative number.' });
      }
      updateData.cost = c;
    }

    if (billingFrequency !== undefined) {
      const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];
      if (!validFrequencies.includes(billingFrequency)) {
        return res.status(400).json({
          success: false,
          message: `Invalid billing frequency. Must be one of: ${validFrequencies.join(', ')}`
        });
      }
      updateData.billingFrequency = billingFrequency;
    }

    if (minQuantity !== undefined) {
      updateData.minQuantity = Math.max(1, parseInt(minQuantity, 10) || 1);
    }

    if (productId !== undefined) {
      updateData.productId = productId || null;
    }

    if (availableFrom !== undefined || startDate !== undefined) {
      const d = availableFrom || startDate;
      updateData.availableFrom = d ? new Date(d) : null;
      updateData.startDate = updateData.availableFrom;
    }

    if (availableTo !== undefined || endDate !== undefined) {
      const d = availableTo || endDate;
      updateData.availableTo = d ? new Date(d) : null;
      updateData.endDate = updateData.availableTo;
    }

    if (autoCloseOnEnd !== undefined || autoCloseAtEnd !== undefined) {
      const ac = autoCloseOnEnd !== undefined ? Boolean(autoCloseOnEnd) : Boolean(autoCloseAtEnd);
      updateData.autoCloseOnEnd = ac;
      updateData.autoCloseAtEnd = ac;
    }

    if (allowEarlyClose !== undefined) updateData.allowEarlyClose = Boolean(allowEarlyClose);
    if (allowPause !== undefined) updateData.allowPause = Boolean(allowPause);
    if (allowRenewal !== undefined) updateData.allowRenewal = Boolean(allowRenewal);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await Plan.findByIdAndUpdate(id, updateData, { new: true });
    const product = updated.productId ? await Product.findById(updated.productId) : null;
    const productMap = product ? { [String(product._id)]: product } : {};

    return res.json({
      success: true,
      message: 'Plan updated successfully',
      plan: normalizePlan(updated, productMap)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update plan',
      error: err.message
    });
  }
};

// DELETE /api/admin/plans/:id and /api/plans/:id
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Invalid plan ID' });
    }

    const existing = await Plan.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    await Plan.findByIdAndUpdate(id, { isActive: false, updatedAt: new Date() });
    return res.json({
      success: true,
      message: `Plan '${existing.name}' deactivated successfully`
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete plan',
      error: err.message
    });
  }
};
