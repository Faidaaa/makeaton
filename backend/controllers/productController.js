const { Product } = require('../models');

// Helper to normalize brandVariants and variants bidirectionally
const normalizeProductVariants = (doc) => {
  if (!doc) return doc;
  const p = { ...doc };

  // Ensure brandVariants is present
  if (!p.brandVariants || !Array.isArray(p.brandVariants) || p.brandVariants.length === 0) {
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      p.brandVariants = p.variants.map(v => ({
        brandName: v.name || 'Standard Edition',
        surcharge: Number(v.priceAdjustment) || 0
      }));
    } else {
      p.brandVariants = [{ brandName: 'Standard Edition', surcharge: 0 }];
    }
  }

  // Ensure variants is also synchronized for other modules
  if (!p.variants || !Array.isArray(p.variants) || p.variants.length === 0) {
    p.variants = p.brandVariants.map(bv => ({
      name: bv.brandName || 'Standard Edition',
      priceAdjustment: Number(bv.surcharge) || 0,
      costAdjustment: 0,
      sku: ''
    }));
  }

  return p;
};

// GET /api/admin/products and /api/products
exports.getAll = async (req, res) => {
  try {
    const { search, name, type, isActive, page, limit } = req.query;

    const filter = {};

    // Search by product name (case-insensitive)
    const searchTerm = (search || name || '').trim();
    if (searchTerm) {
      filter.name = { $regex: searchTerm, $options: 'i' };
    }

    // Filter by product type
    if (type && type !== 'all') {
      filter.type = type;
    }

    // Filter by active state (by default return active products unless explicitly requested)
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

    const total = await Product.countDocuments(filter);
    const rawProducts = await Product.find(filter, { createdAt: -1 }, pagination);
    const products = rawProducts.map(normalizeProductVariants);

    return res.json({
      success: true,
      count: products.length,
      total,
      page: isPaginated ? pageNum : 1,
      totalPages: isPaginated ? Math.ceil(total / limitNum) || 1 : 1,
      products
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve products',
      error: err.message
    });
  }
};

// GET /api/admin/products/:id and /api/products/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({
      success: true,
      product: normalizeProductVariants(product)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: err.message
    });
  }
};

// POST /api/admin/products and /api/products
exports.create = async (req, res) => {
  try {
    const { name, type, salesPrice, costPrice, brandVariants, variants, notes } = req.body;

    // Validation: Product name is required
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required.'
      });
    }

    // Validation: Sales price is required and must be valid number >= 0
    if (salesPrice === undefined || salesPrice === null || salesPrice === '') {
      return res.status(400).json({
        success: false,
        message: 'Sales price is required.'
      });
    }

    const numericSalesPrice = Number(salesPrice);
    if (isNaN(numericSalesPrice) || numericSalesPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Sales price must be a valid non-negative number.'
      });
    }

    // Validation: Cost price must be a valid number >= 0 if provided
    let numericCostPrice = 0;
    if (costPrice !== undefined && costPrice !== null && costPrice !== '') {
      numericCostPrice = Number(costPrice);
      if (isNaN(numericCostPrice) || numericCostPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Cost price must be a valid non-negative number.'
        });
      }
    }

    // Process and validate Brand Variants
    let parsedBrandVariants = [];
    let parsedVariants = [];

    if (Array.isArray(brandVariants) && brandVariants.length > 0) {
      for (let i = 0; i < brandVariants.length; i++) {
        const bv = brandVariants[i];
        const bName = (bv.brandName || bv.name || '').trim();
        if (!bName) {
          return res.status(400).json({
            success: false,
            message: `Brand name cannot be empty for variant at index ${i}.`
          });
        }
        const surcharge = Number(bv.surcharge !== undefined ? bv.surcharge : bv.priceAdjustment);
        if (isNaN(surcharge) || surcharge < 0) {
          return res.status(400).json({
            success: false,
            message: `Surcharge for brand variant "${bName}" cannot be negative.`
          });
        }
        parsedBrandVariants.push({
          brandName: bName,
          surcharge
        });
        parsedVariants.push({
          name: bName,
          priceAdjustment: surcharge,
          costAdjustment: 0,
          sku: bv.sku || ''
        });
      }
    } else if (Array.isArray(variants) && variants.length > 0) {
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const vName = (v.name || v.brandName || '').trim();
        if (!vName) {
          return res.status(400).json({
            success: false,
            message: `Brand name cannot be empty for variant at index ${i}.`
          });
        }
        const surcharge = Number(v.priceAdjustment !== undefined ? v.priceAdjustment : v.surcharge);
        if (isNaN(surcharge) || surcharge < 0) {
          return res.status(400).json({
            success: false,
            message: `Surcharge for brand variant "${vName}" cannot be negative.`
          });
        }
        parsedBrandVariants.push({
          brandName: vName,
          surcharge
        });
        parsedVariants.push({
          name: vName,
          priceAdjustment: surcharge,
          costAdjustment: Number(v.costAdjustment) || 0,
          sku: v.sku || ''
        });
      }
    } else {
      parsedBrandVariants = [{ brandName: 'Standard Edition', surcharge: 0 }];
      parsedVariants = [{ name: 'Standard Edition', priceAdjustment: 0, costAdjustment: 0, sku: '' }];
    }

    const product = await Product.create({
      name: name.trim(),
      type: type || 'Software',
      salesPrice: numericSalesPrice,
      costPrice: numericCostPrice,
      brandVariants: parsedBrandVariants,
      variants: parsedVariants,
      notes: (notes || '').trim(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return res.status(201).json({
      success: true,
      message: `Product '${product.name}' created successfully with ${parsedBrandVariants.length} brand variant(s).`,
      product: normalizeProductVariants(product)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: err.message
    });
  }
};

// PUT /api/admin/products/:id and /api/products/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const existing = await Product.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { name, type, salesPrice, costPrice, brandVariants, variants, notes, isActive } = req.body;
    const updateData = { updatedAt: new Date() };

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Product name cannot be empty.' });
      }
      updateData.name = name.trim();
    }

    if (type !== undefined) {
      updateData.type = type;
    }

    if (salesPrice !== undefined) {
      const sp = Number(salesPrice);
      if (isNaN(sp) || sp < 0) {
        return res.status(400).json({ success: false, message: 'Sales price must be a valid non-negative number.' });
      }
      updateData.salesPrice = sp;
    }

    if (costPrice !== undefined) {
      const cp = Number(costPrice);
      if (isNaN(cp) || cp < 0) {
        return res.status(400).json({ success: false, message: 'Cost price must be a valid non-negative number.' });
      }
      updateData.costPrice = cp;
    }

    if (notes !== undefined) {
      updateData.notes = typeof notes === 'string' ? notes.trim() : '';
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    // Process brandVariants if provided
    if (Array.isArray(brandVariants)) {
      const parsedBrandVariants = [];
      const parsedVariants = [];

      for (let i = 0; i < brandVariants.length; i++) {
        const bv = brandVariants[i];
        const bName = (bv.brandName || bv.name || '').trim();
        if (!bName) {
          return res.status(400).json({
            success: false,
            message: `Brand name cannot be empty for variant at index ${i}.`
          });
        }
        const surcharge = Number(bv.surcharge !== undefined ? bv.surcharge : bv.priceAdjustment);
        if (isNaN(surcharge) || surcharge < 0) {
          return res.status(400).json({
            success: false,
            message: `Surcharge for brand variant "${bName}" cannot be negative.`
          });
        }
        parsedBrandVariants.push({ brandName: bName, surcharge });
        parsedVariants.push({ name: bName, priceAdjustment: surcharge, costAdjustment: 0, sku: bv.sku || '' });
      }

      updateData.brandVariants = parsedBrandVariants;
      updateData.variants = parsedVariants;
    } else if (Array.isArray(variants)) {
      const parsedBrandVariants = [];
      const parsedVariants = [];

      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const vName = (v.name || v.brandName || '').trim();
        if (!vName) {
          return res.status(400).json({
            success: false,
            message: `Brand name cannot be empty for variant at index ${i}.`
          });
        }
        const surcharge = Number(v.priceAdjustment !== undefined ? v.priceAdjustment : v.surcharge);
        if (isNaN(surcharge) || surcharge < 0) {
          return res.status(400).json({
            success: false,
            message: `Surcharge for brand variant "${vName}" cannot be negative.`
          });
        }
        parsedBrandVariants.push({ brandName: vName, surcharge });
        parsedVariants.push({
          name: vName,
          priceAdjustment: surcharge,
          costAdjustment: Number(v.costAdjustment) || 0,
          sku: v.sku || ''
        });
      }

      updateData.brandVariants = parsedBrandVariants;
      updateData.variants = parsedVariants;
    }

    const updated = await Product.findByIdAndUpdate(id, updateData, { new: true });
    return res.json({
      success: true,
      message: 'Product updated successfully',
      product: normalizeProductVariants(updated)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: err.message
    });
  }
};

// DELETE /api/admin/products/:id and /api/products/:id
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const existing = await Product.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.findByIdAndUpdate(id, { isActive: false, updatedAt: new Date() });
    return res.json({
      success: true,
      message: `Product '${existing.name}' deactivated successfully`
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: err.message
    });
  }
};
