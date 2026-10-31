const assert = require('assert');
const { connectDB } = require('../config/db');
const { seedDatabase } = require('../seed/demoData');
const adminDashboard = require('../controllers/adminDashboardController');
const productController = require('../controllers/productController');
const planController = require('../controllers/planController');
const taxController = require('../controllers/taxController');
const discountController = require('../controllers/discountController');

// Mock req and res helper
const createMockContext = (overrides = {}) => {
  const req = {
    params: {},
    query: {},
    body: {},
    headers: {},
    user: { role: 'admin', name: 'Eleanor Vance' },
    ...overrides
  };

  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };

  return { req, res };
};

async function runTests() {
  console.log('>>> Starting Member 2 Backend Test Suite...\n');
  await connectDB();
  await seedDatabase();

  // 1. ADMIN DASHBOARD METRICS
  console.log('Test 1: GET /api/admin/dashboard');
  {
    const { req, res } = createMockContext();
    await adminDashboard.getDashboardStats(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert(res.data.stats.totalProducts >= 4, 'Total products should be at least 4');
    assert(res.data.stats.totalPlans >= 3, 'Total plans should be at least 3');
    assert(res.data.stats.activeTaxRules >= 1, 'Active tax rules should be at least 1');
    assert(res.data.stats.activeDiscountRules >= 1, 'Active discount rules should be at least 1');
    assert(Array.isArray(res.data.recentProducts), 'Recent products should be an array');
    assert(Array.isArray(res.data.recentPlans), 'Recent plans should be an array');
    console.log('  PASS: Admin dashboard returned stats & recent items');
  }

  // 2. ADMIN RECENT PRODUCTS & PLANS
  console.log('Test 2: GET /api/admin/dashboard/recent-products & recent-plans');
  {
    const { req: req1, res: res1 } = createMockContext({ query: { limit: 2 } });
    await adminDashboard.getRecentProducts(req1, res1);
    assert.strictEqual(res1.statusCode, 200);
    assert.strictEqual(res1.data.recentProducts.length, 2);

    const { req: req2, res: res2 } = createMockContext({ query: { limit: 2 } });
    await adminDashboard.getRecentPlans(req2, res2);
    assert.strictEqual(res2.statusCode, 200);
    assert.strictEqual(res2.data.recentPlans.length, 2);
    console.log('  PASS: Recent products and plans endpoints responded correctly with limit');
  }

  // 3. PRODUCT CATALOG MANAGEMENT & BRAND VARIANTS
  console.log('Test 3: Product Catalog CRUD, Search, Filter, Pagination, Validation');
  let createdProductId = null;
  {
    // Search test
    const { req: sReq, res: sRes } = createMockContext({ query: { search: 'CRM' } });
    await productController.getAll(sReq, sRes);
    assert.strictEqual(sRes.statusCode, 200);
    assert(sRes.data.products.length >= 1, 'Search for CRM should find at least 1 product');

    // Type filter test
    const { req: tReq, res: tRes } = createMockContext({ query: { type: 'Software' } });
    await productController.getAll(tReq, tRes);
    assert.strictEqual(tRes.statusCode, 200);
    assert(tRes.data.products.every(p => p.type === 'Software'), 'Filter by Software should only return software');

    // Validation test: Empty name should fail
    const { req: vReq1, res: vRes1 } = createMockContext({ body: { name: '', salesPrice: 100 } });
    await productController.create(vReq1, vRes1);
    assert.strictEqual(vRes1.statusCode, 400);

    // Validation test: Negative salesPrice should fail
    const { req: vReq2, res: vRes2 } = createMockContext({ body: { name: 'Bad Product', salesPrice: -50 } });
    await productController.create(vReq2, vRes2);
    assert.strictEqual(vRes2.statusCode, 400);

    // Validation test: Negative brand surcharge should fail
    const { req: vReq3, res: vRes3 } = createMockContext({
      body: {
        name: 'Bad Product 2',
        salesPrice: 100,
        brandVariants: [{ brandName: 'Odoo Surcharge', surcharge: -20 }]
      }
    });
    await productController.create(vReq3, vRes3);
    assert.strictEqual(vRes3.statusCode, 400);

    // Creation test: Valid product with Odoo surcharge +560
    const { req: cReq, res: cRes } = createMockContext({
      body: {
        name: 'Brightloop Inventory Pro',
        type: 'Software',
        salesPrice: 500,
        costPrice: 100,
        notes: 'Warehouse automation',
        brandVariants: [
          { brandName: 'Standard Cloud Edition', surcharge: 0 },
          { brandName: 'Brand: Odoo Integration Edition', surcharge: 560 }
        ]
      }
    });
    await productController.create(cReq, cRes);
    assert.strictEqual(cRes.statusCode, 201);
    assert.strictEqual(cRes.data.success, true);
    assert.strictEqual(cRes.data.product.brandVariants.length, 2);
    assert.strictEqual(cRes.data.product.brandVariants[1].surcharge, 560);
    createdProductId = cRes.data.product._id;

    // GetById test
    const { req: gReq, res: gRes } = createMockContext({ params: { id: createdProductId } });
    await productController.getById(gReq, gRes);
    assert.strictEqual(gRes.statusCode, 200);
    assert.strictEqual(gRes.data.product.name, 'Brightloop Inventory Pro');

    // Update test
    const { req: uReq, res: uRes } = createMockContext({
      params: { id: createdProductId },
      body: { salesPrice: 550, notes: 'Updated notes' }
    });
    await productController.update(uReq, uRes);
    assert.strictEqual(uRes.statusCode, 200);
    assert.strictEqual(uRes.data.product.salesPrice, 550);

    // Delete test
    const { req: dReq, res: dRes } = createMockContext({ params: { id: createdProductId } });
    await productController.delete(dReq, dRes);
    assert.strictEqual(dRes.statusCode, 200);
    console.log('  PASS: Product Catalog & Brand Variants CRUD & Validation validated');
  }

  // 4. SUBSCRIPTION PLAN MANAGEMENT
  console.log('Test 4: Subscription Plan CRUD, Cadences, Lifecycle Rules');
  let createdPlanId = null;
  {
    // Validation: Invalid frequency fails
    const { req: vReq, res: vRes } = createMockContext({
      body: { name: 'Invalid Plan', cost: 100, billingFrequency: 'hourly' }
    });
    await planController.create(vReq, vRes);
    assert.strictEqual(vRes.statusCode, 400);

    // Create plan test
    const { req: cReq, res: cRes } = createMockContext({
      body: {
        name: 'Quarterly Growth Accelerator',
        billingFrequency: 'monthly',
        cost: 299,
        minQuantity: 3,
        autoCloseOnEnd: true,
        allowPause: true,
        allowEarlyClose: true,
        allowRenewal: true
      }
    });
    await planController.create(cReq, cRes);
    assert.strictEqual(cRes.statusCode, 201);
    assert.strictEqual(cRes.data.plan.billingFrequency, 'monthly');
    assert.strictEqual(cRes.data.plan.minQuantity, 3);
    createdPlanId = cRes.data.plan._id;

    // Get plan by ID
    const { req: gReq, res: gRes } = createMockContext({ params: { id: createdPlanId } });
    await planController.getById(gReq, gRes);
    assert.strictEqual(gRes.statusCode, 200);
    assert.strictEqual(gRes.data.plan.name, 'Quarterly Growth Accelerator');

    // Update plan
    const { req: uReq, res: uRes } = createMockContext({
      params: { id: createdPlanId },
      body: { cost: 320 }
    });
    await planController.update(uReq, uRes);
    assert.strictEqual(uRes.statusCode, 200);
    assert.strictEqual(uRes.data.plan.cost, 320);

    // Delete plan
    const { req: dReq, res: dRes } = createMockContext({ params: { id: createdPlanId } });
    await planController.delete(dReq, dRes);
    assert.strictEqual(dRes.statusCode, 200);
    console.log('  PASS: Subscription Plan CRUD & Lifecycle Rules validated');
  }

  // 5. TAX RULES ENGINE
  console.log('Test 5: Tax Rules Engine CRUD, Rates & Defaults');
  let createdTaxId = null;
  {
    // Rate > 100 fails
    const { req: vReq, res: vRes } = createMockContext({
      body: { name: 'Invalid Tax', rate: 150 }
    });
    await taxController.create(vReq, vRes);
    assert.strictEqual(vRes.statusCode, 400);

    // Create tax rule
    const { req: cReq, res: cRes } = createMockContext({
      body: { name: 'Nordic VAT', rate: 25, country: 'Sweden', isDefault: false, description: '25% Nordic standard' }
    });
    await taxController.create(cReq, cRes);
    assert.strictEqual(cRes.statusCode, 201);
    assert.strictEqual(cRes.data.rule.rate, 25);
    createdTaxId = cRes.data.rule._id;

    // Get by ID
    const { req: gReq, res: gRes } = createMockContext({ params: { id: createdTaxId } });
    await taxController.getById(gReq, gRes);
    assert.strictEqual(gRes.statusCode, 200);

    // Update tax rule
    const { req: uReq, res: uRes } = createMockContext({
      params: { id: createdTaxId },
      body: { rate: 24 }
    });
    await taxController.update(uReq, uRes);
    assert.strictEqual(uRes.statusCode, 200);
    assert.strictEqual(uRes.data.rule.rate, 24);

    // Delete tax rule
    const { req: dReq, res: dRes } = createMockContext({ params: { id: createdTaxId } });
    await taxController.delete(dReq, dRes);
    assert.strictEqual(dRes.statusCode, 200);
    console.log('  PASS: Tax Rules Engine CRUD & Rate validation validated');
  }

  // 6. DISCOUNT RULES ENGINE
  console.log('Test 6: Discount Rules Engine CRUD & Validation Engine');
  let createdDiscountId = null;
  {
    // Create discount rule
    const { req: cReq, res: cRes } = createMockContext({
      body: {
        code: 'TESTVOL25',
        name: '25% Off for 10+ Seats',
        type: 'percentage',
        value: 25,
        minQuantity: 10,
        minPurchaseAmount: 1000,
        usageLimit: 50
      }
    });
    await discountController.create(cReq, cRes);
    assert.strictEqual(cRes.statusCode, 201);
    assert.strictEqual(cRes.data.discount.code, 'TESTVOL25');
    createdDiscountId = cRes.data.discount._id;

    // Duplicate code should fail
    const { req: dupReq, res: dupRes } = createMockContext({
      body: { code: 'TESTVOL25', name: 'Duplicate', value: 10 }
    });
    await discountController.create(dupReq, dupRes);
    assert.strictEqual(dupRes.statusCode, 400);

    // Validate engine: quantity below minimum should fail
    const { req: valReq1, res: valRes1 } = createMockContext({
      body: { code: 'TESTVOL25', totalQuantity: 5, subtotal: 2000 }
    });
    await discountController.validateRule(valReq1, valRes1);
    assert.strictEqual(valRes1.statusCode, 400);

    // Validate engine: subtotal below minimum purchase should fail
    const { req: valReq2, res: valRes2 } = createMockContext({
      body: { code: 'TESTVOL25', totalQuantity: 12, subtotal: 500 }
    });
    await discountController.validateRule(valReq2, valRes2);
    assert.strictEqual(valRes2.statusCode, 400);

    // Validate engine: valid cart should succeed and calculate 25% of 2000 = 500
    const { req: valReq3, res: valRes3 } = createMockContext({
      body: { code: 'TESTVOL25', totalQuantity: 12, subtotal: 2000 }
    });
    await discountController.validateRule(valReq3, valRes3);
    assert.strictEqual(valRes3.statusCode, 200);
    assert.strictEqual(valRes3.data.valid, true);
    assert.strictEqual(valRes3.data.savings, 500);

    // Update discount
    const { req: uReq, res: uRes } = createMockContext({
      params: { id: createdDiscountId },
      body: { name: '25% Enterprise Volume Deal' }
    });
    await discountController.update(uReq, uRes);
    assert.strictEqual(uRes.statusCode, 200);

    // Delete discount
    const { req: dReq, res: dRes } = createMockContext({ params: { id: createdDiscountId } });
    await discountController.delete(dReq, dRes);
    assert.strictEqual(dRes.statusCode, 200);
    console.log('  PASS: Discount Rules Engine & Evaluation Engine validated');
  }

  console.log('\n=============================================');
  console.log('ALL MEMBER 2 BACKEND TESTS PASSED 100%!');
  console.log('=============================================');
}

runTests().catch(err => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
