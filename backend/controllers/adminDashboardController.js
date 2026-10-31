const { Product, Plan, TaxRule, Discount, Subscription } = require('../models');

// Helper to normalize product brandVariants
const normalizeProductVariants = (p) => {
  if (!p) return p;
  const item = { ...p };
  if (!item.brandVariants || !Array.isArray(item.brandVariants) || item.brandVariants.length === 0) {
    if (Array.isArray(item.variants) && item.variants.length > 0) {
      item.brandVariants = item.variants.map(v => ({
        brandName: v.name || 'Standard Edition',
        surcharge: Number(v.priceAdjustment) || 0
      }));
    } else {
      item.brandVariants = [{ brandName: 'Standard Edition', surcharge: 0 }];
    }
  }
  return item;
};

// GET /api/admin/dashboard
exports.getDashboardStats = async (req, res) => {
  const startTime = Date.now();
  try {
    // 1. Fetch counts
    const [
      totalProducts,
      activeProducts,
      totalPlans,
      activePlans,
      activeTaxRules,
      totalTaxRules,
      activeDiscountRules,
      totalDiscountRules,
      totalSubscriptions,
      activeSubscriptions
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Plan.countDocuments(),
      Plan.countDocuments({ isActive: true }),
      TaxRule.countDocuments({ isActive: true }),
      TaxRule.countDocuments(),
      Discount.countDocuments({ isActive: true }),
      Discount.countDocuments(),
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: 'Active' })
    ]);

    // 2. Fetch Recent Products (5 most recent)
    const rawRecentProducts = await Product.find({}, { createdAt: -1 }, { skip: 0, limit: 5 });
    const recentProducts = rawRecentProducts.map(normalizeProductVariants);

    // 3. Fetch Recent Plans (5 most recent) with associated product names
    const rawRecentPlans = await Plan.find({}, { createdAt: -1 }, { skip: 0, limit: 5 });
    const allProducts = await Product.find();
    const productMap = {};
    allProducts.forEach(p => { productMap[String(p._id)] = p; });

    const recentPlans = rawRecentPlans.map(plan => ({
      ...plan,
      product: plan.productId ? productMap[String(plan.productId)] || null : null
    }));

    const responseTimeMs = Date.now() - startTime;

    return res.json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        totalPlans,
        activePlans,
        activeTaxRules,
        totalTaxRules,
        activeDiscountRules,
        totalDiscountRules,
        totalSubscriptions,
        activeSubscriptions
      },
      recentProducts,
      recentPlans,
      performance: {
        responseTimeMs,
        satisfiesUnderTwoSecondsSla: responseTimeMs < 2000
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin dashboard metrics',
      error: err.message
    });
  }
};

// GET /api/admin/dashboard/recent-products
exports.getRecentProducts = async (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 5));
    const raw = await Product.find({}, { createdAt: -1 }, { skip: 0, limit });
    const recentProducts = raw.map(normalizeProductVariants);
    return res.json({
      success: true,
      count: recentProducts.length,
      recentProducts
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent products',
      error: err.message
    });
  }
};

// GET /api/admin/dashboard/recent-plans
exports.getRecentPlans = async (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 5));
    const rawPlans = await Plan.find({}, { createdAt: -1 }, { skip: 0, limit });
    const allProducts = await Product.find();
    const productMap = {};
    allProducts.forEach(p => { productMap[String(p._id)] = p; });

    const recentPlans = rawPlans.map(plan => ({
      ...plan,
      product: plan.productId ? productMap[String(plan.productId)] || null : null
    }));

    return res.json({
      success: true,
      count: recentPlans.length,
      recentPlans
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent plans',
      error: err.message
    });
  }
};
