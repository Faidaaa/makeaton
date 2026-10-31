const { Discount, Product } = require('../models');

// GET /api/admin/discounts and /api/discounts
exports.getAll = async (req, res) => {
  try {
    const { search, name, code, type, isActive } = req.query;
    const filter = {};

    const searchTerm = (search || name || code || '').trim();
    if (searchTerm) {
      filter.$or = [
        { code: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }

    const discounts = await Discount.find(filter, { createdAt: -1 });
    return res.json({
      success: true,
      count: discounts.length,
      discounts
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve discounts',
      error: err.message
    });
  }
};

// GET /api/admin/discounts/:id and /api/discounts/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Invalid discount rule ID' });
    }

    const discount = await Discount.findById(id);
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount rule not found' });
    }

    return res.json({
      success: true,
      discount
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch discount',
      error: err.message
    });
  }
};

// POST /api/admin/discounts and /api/discounts
exports.create = async (req, res) => {
  try {
    const {
      code,
      name,
      type,
      value,
      minQuantity,
      minPurchaseAmount,
      startDate,
      endDate,
      usageLimit,
      appliesTo,
      productIds
    } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Discount code is required.' });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Discount rule name is required.' });
    }

    if (value === undefined || value === null || value === '') {
      return res.status(400).json({ success: false, message: 'Discount value is required.' });
    }

    const numericValue = Number(value);
    if (isNaN(numericValue) || numericValue < 0) {
      return res.status(400).json({ success: false, message: 'Discount value must be a non-negative number.' });
    }

    const discountType = type === 'fixed' ? 'fixed' : 'percentage';
    if (discountType === 'percentage' && numericValue > 100) {
      return res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100%.' });
    }

    const cleanCode = code.toUpperCase().trim();
    const existing = await Discount.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Discount code '${cleanCode}' already exists.`
      });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : null;
    if (end && start && end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date.'
      });
    }

    const discount = await Discount.create({
      code: cleanCode,
      name: name.trim(),
      type: discountType,
      value: numericValue,
      minQuantity: Math.max(0, parseInt(minQuantity, 10) || 0),
      minPurchaseAmount: Math.max(0, Number(minPurchaseAmount) || 0),
      startDate: start,
      endDate: end,
      usageLimit: Math.max(0, parseInt(usageLimit, 10) || 100),
      usageCount: 0,
      appliesTo: appliesTo === 'specific_products' ? 'specific_products' : 'whole_subscription',
      productIds: Array.isArray(productIds) ? productIds : [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return res.status(201).json({
      success: true,
      message: `Discount rule '${discount.code}' created successfully!`,
      discount
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create discount rule',
      error: err.message
    });
  }
};

// PUT /api/admin/discounts/:id and /api/discounts/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Invalid discount rule ID' });
    }

    const existing = await Discount.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Discount rule not found' });
    }

    const {
      code,
      name,
      type,
      value,
      minQuantity,
      minPurchaseAmount,
      startDate,
      endDate,
      usageLimit,
      usageCount,
      appliesTo,
      productIds,
      isActive
    } = req.body;

    const updateData = { updatedAt: new Date() };

    if (code !== undefined) {
      const cleanCode = code.toUpperCase().trim();
      if (!cleanCode) return res.status(400).json({ success: false, message: 'Code cannot be empty.' });
      if (cleanCode !== existing.code) {
        const duplicate = await Discount.findOne({ code: cleanCode });
        if (duplicate && String(duplicate._id) !== String(id)) {
          return res.status(400).json({ success: false, message: `Discount code '${cleanCode}' already exists.` });
        }
      }
      updateData.code = cleanCode;
    }

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
      updateData.name = name.trim();
    }

    if (type !== undefined) {
      updateData.type = type === 'fixed' ? 'fixed' : 'percentage';
    }

    if (value !== undefined) {
      const val = Number(value);
      if (isNaN(val) || val < 0) {
        return res.status(400).json({ success: false, message: 'Discount value must be a non-negative number.' });
      }
      const targetType = updateData.type || existing.type;
      if (targetType === 'percentage' && val > 100) {
        return res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100%.' });
      }
      updateData.value = val;
    }

    if (minQuantity !== undefined) updateData.minQuantity = Math.max(0, parseInt(minQuantity, 10) || 0);
    if (minPurchaseAmount !== undefined) updateData.minPurchaseAmount = Math.max(0, Number(minPurchaseAmount) || 0);
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (usageLimit !== undefined) updateData.usageLimit = Math.max(0, parseInt(usageLimit, 10) || 0);
    if (usageCount !== undefined) updateData.usageCount = Math.max(0, parseInt(usageCount, 10) || 0);
    if (appliesTo !== undefined) updateData.appliesTo = appliesTo;
    if (Array.isArray(productIds)) updateData.productIds = productIds;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await Discount.findByIdAndUpdate(id, updateData, { new: true });
    return res.json({
      success: true,
      message: 'Discount rule updated successfully',
      discount: updated
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update discount rule',
      error: err.message
    });
  }
};

// DELETE /api/admin/discounts/:id and /api/discounts/:id
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Invalid discount rule ID' });
    }

    const existing = await Discount.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Discount rule not found' });
    }

    await Discount.findByIdAndDelete(id);
    return res.json({
      success: true,
      message: `Discount rule '${existing.code}' deleted successfully.`
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete discount',
      error: err.message
    });
  }
};

// Check discount eligibility helper
// POST /api/discounts/validate
exports.validateRule = async (req, res) => {
  try {
    const { code, subtotal, totalQuantity, productIds } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Discount code is required' });

    const discount = await Discount.findOne({ code: code.toUpperCase().trim(), isActive: true });
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive discount code.' });
    }

    // Check usage limit
    if (discount.usageLimit > 0 && discount.usageCount >= discount.usageLimit) {
      return res.status(400).json({ success: false, message: 'This discount has reached its maximum usage limit.' });
    }

    // Check date validity
    const now = new Date();
    if (discount.startDate && new Date(discount.startDate) > now) {
      return res.status(400).json({ success: false, message: 'This discount is not yet active.' });
    }
    if (discount.endDate && new Date(discount.endDate) < now) {
      return res.status(400).json({ success: false, message: 'This discount has expired.' });
    }

    // Check minimum quantity
    if (discount.minQuantity > 0 && (Number(totalQuantity) || 0) < discount.minQuantity) {
      return res.status(400).json({
        success: false,
        message: `Requires a minimum quantity of ${discount.minQuantity} items/seats.`
      });
    }

    // Check minimum purchase amount
    if (discount.minPurchaseAmount > 0 && (Number(subtotal) || 0) < discount.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Requires a minimum purchase amount of $${discount.minPurchaseAmount}.`
      });
    }

    // Calculate estimated savings
    let calculatedSavings = 0;
    if (discount.type === 'percentage') {
      calculatedSavings = (Number(subtotal) * discount.value) / 100;
    } else {
      calculatedSavings = Math.min(Number(subtotal), discount.value);
    }

    return res.json({
      success: true,
      valid: true,
      discount,
      savings: calculatedSavings,
      message: `Discount '${discount.code}' applies! You save $${calculatedSavings.toFixed(2)}.`
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Validation failed',
      error: err.message
    });
  }
};
