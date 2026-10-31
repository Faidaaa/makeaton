const assert = require('assert');
const jwt = require('jsonwebtoken');
const { connectDB } = require('../config/db');
const { seedDatabase } = require('../seed/demoData');
const { authenticate, authorize, JWT_SECRET } = require('../middleware/auth');
const adminDashboardController = require('../controllers/adminDashboardController');
const { User } = require('../models');

async function testMiddlewareChain() {
  console.log('>>> Testing Auth & RBAC Middleware Chain...\n');
  await connectDB();
  await seedDatabase();

  const admin = await User.findOne({ role: 'admin' });
  const staff = await User.findOne({ role: 'staff' });
  const customer = await User.findOne({ role: 'customer' });

  const adminToken = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '1h' });
  const staffToken = jwt.sign({ id: staff._id }, JWT_SECRET, { expiresIn: '1h' });
  const customerToken = jwt.sign({ id: customer._id }, JWT_SECRET, { expiresIn: '1h' });

  const runMiddleware = (fn, req) => {
    return new Promise(resolve => {
      let status = 200, body = null, nextCalled = false;
      const res = {
        status(code) { status = code; return this; },
        json(data) { body = data; resolve({ status, body, nextCalled }); return this; }
      };
      fn(req, res, () => {
        nextCalled = true;
        resolve({ status, body, nextCalled });
      });
    });
  };

  // Case 1: No auth header -> 401
  {
    const req = { headers: {} };
    const result = await runMiddleware(authenticate, req);
    assert.strictEqual(result.status, 401, 'Missing token must yield 401');
    assert.strictEqual(result.nextCalled, false);
    console.log('  PASS: Missing auth header blocked with 401');
  }

  // Case 2: Invalid token -> 401
  {
    const req = { headers: { authorization: 'Bearer invalid_garbage_token' } };
    const result = await runMiddleware(authenticate, req);
    assert.strictEqual(result.status, 401, 'Invalid token must yield 401');
    assert.strictEqual(result.nextCalled, false);
    console.log('  PASS: Invalid token blocked with 401');
  }

  // Case 3: Customer trying to access Admin route -> 403 Forbidden
  {
    const req = { headers: { authorization: `Bearer ${customerToken}` } };
    const authResult = await runMiddleware(authenticate, req);
    assert.strictEqual(authResult.nextCalled, true);
    assert.strictEqual(req.user.role, 'customer');

    const rbacResult = await runMiddleware(authorize(['admin']), req);
    assert.strictEqual(rbacResult.status, 403, 'Customer role must yield 403 on admin route');
    assert.strictEqual(rbacResult.nextCalled, false);
    console.log('  PASS: Customer role blocked with 403 on admin-only route');
  }

  // Case 4: Staff trying to access Admin route -> 403 Forbidden
  {
    const req = { headers: { authorization: `Bearer ${staffToken}` } };
    const authResult = await runMiddleware(authenticate, req);
    assert.strictEqual(authResult.nextCalled, true);
    assert.strictEqual(req.user.role, 'staff');

    const rbacResult = await runMiddleware(authorize(['admin']), req);
    assert.strictEqual(rbacResult.status, 403, 'Staff role must yield 403 on admin route');
    assert.strictEqual(rbacResult.nextCalled, false);
    console.log('  PASS: Staff role blocked with 403 on admin-only route');
  }

  // Case 5: Admin accessing Admin route -> Passes and executes controller
  {
    const req = { headers: { authorization: `Bearer ${adminToken}` }, query: {} };
    const authResult = await runMiddleware(authenticate, req);
    assert.strictEqual(authResult.nextCalled, true);
    assert.strictEqual(req.user.role, 'admin');

    const rbacResult = await runMiddleware(authorize(['admin']), req);
    assert.strictEqual(rbacResult.nextCalled, true);

    let status = 200, body = null;
    const res = {
      status(code) { status = code; return this; },
      json(data) { body = data; return this; }
    };
    await adminDashboardController.getDashboardStats(req, res);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.success, true);
    assert(body.stats.totalProducts >= 4);
    assert(body.stats.totalPlans >= 3);
    assert(body.stats.activeTaxRules >= 1);
    assert(body.stats.activeDiscountRules >= 1);
    console.log('  PASS: Admin role successfully authenticated, authorized, and served dashboard stats');
  }

  console.log('\n=============================================');
  console.log('ALL AUTH & RBAC TESTS PASSED WITH 100% SUCCESS!');
  console.log('=============================================');
}

testMiddlewareChain().catch(err => {
  console.error('Middleware Test Failed:', err);
  process.exit(1);
});
