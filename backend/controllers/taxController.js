const { TaxRule } = require('../models');

// GET /api/admin/taxes and /api/taxes
exports.getAll = async (req, res) => {
  try {
    const { search, name, country, isActive } = req.query;
    const filter = {};

    const searchTerm = (search || name || '').trim();
    if (searchTerm) {
      filter.name = { $regex: searchTerm, $options: 'i' };
    }

    if (country && country !== 'all') {
      filter.country = { $regex: country.trim(), $options: 'i' };
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }

    const rules = await TaxRule.find(filter, { createdAt: -1 });
    return res.json({
      success: true,
      count: rules.length,
      taxRules: rules
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tax rules',
      error: err.message
    });
  }
};

// GET /api/admin/taxes/:id and /api/taxes/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Invalid tax rule ID' });
    }

    const rule = await TaxRule.findById(id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Tax rule not found' });
    }

    return res.json({
      success: true,
      rule
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tax rule',
      error: err.message
    });
  }
};

// POST /api/admin/taxes and /api/taxes
exports.create = async (req, res) => {
  try {
    const { name, rate, country, taxType, isDefault, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tax rule name is required.'
      });
    }

    if (rate === undefined || rate === null || rate === '') {
      return res.status(400).json({
        success: false,
        message: 'Tax percentage rate is required.'
      });
    }

    const numericRate = Number(rate);
    if (isNaN(numericRate) || numericRate < 0 || numericRate > 100) {
      return res.status(400).json({
        success: false,
        message: 'Tax rate must be a valid percentage between 0% and 100%.'
      });
    }

    if (Boolean(isDefault)) {
      // Unset previous defaults
      const all = await TaxRule.find();
      for (const t of all) {
        if (t.isDefault) await TaxRule.findByIdAndUpdate(t._id, { isDefault: false });
      }
    }

    const rule = await TaxRule.create({
      name: name.trim(),
      rate: numericRate,
      country: (country || 'Global').trim(),
      taxType: taxType || 'VAT',
      isDefault: Boolean(isDefault),
      description: (description || '').trim(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return res.status(201).json({
      success: true,
      message: `Tax rule '${rule.name}' (${rule.rate}%) created successfully!`,
      rule
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create tax rule',
      error: err.message
    });
  }
};

// PUT /api/admin/taxes/:id and /api/taxes/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Invalid tax rule ID' });
    }

    const existing = await TaxRule.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Tax rule not found' });
    }

    const { name, rate, country, taxType, isDefault, description, isActive } = req.body;
    const updateData = { updatedAt: new Date() };

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Tax rule name cannot be empty.' });
      }
      updateData.name = name.trim();
    }

    if (rate !== undefined) {
      const numericRate = Number(rate);
      if (isNaN(numericRate) || numericRate < 0 || numericRate > 100) {
        return res.status(400).json({
          success: false,
          message: 'Tax rate must be a valid percentage between 0% and 100%.'
        });
      }
      updateData.rate = numericRate;
    }

    if (country !== undefined) updateData.country = (country || 'Global').trim();
    if (taxType !== undefined) updateData.taxType = taxType;
    if (description !== undefined) updateData.description = typeof description === 'string' ? description.trim() : '';
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    if (isDefault !== undefined && Boolean(isDefault)) {
      const all = await TaxRule.find();
      for (const t of all) {
        if (String(t._id) !== String(id) && t.isDefault) {
          await TaxRule.findByIdAndUpdate(t._id, { isDefault: false });
        }
      }
      updateData.isDefault = true;
    } else if (isDefault !== undefined) {
      updateData.isDefault = false;
    }

    const updated = await TaxRule.findByIdAndUpdate(id, updateData, { new: true });
    return res.json({
      success: true,
      message: 'Tax rule updated successfully',
      rule: updated
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update tax rule',
      error: err.message
    });
  }
};

// DELETE /api/admin/taxes/:id and /api/taxes/:id
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Invalid tax rule ID' });
    }

    const existing = await TaxRule.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Tax rule not found' });
    }

    await TaxRule.findByIdAndDelete(id);
    return res.json({
      success: true,
      message: `Tax rule '${existing.name}' deleted successfully`
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete tax rule',
      error: err.message
    });
  }
};
