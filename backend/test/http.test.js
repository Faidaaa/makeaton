const http = require('http');
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const { connectDB } = require('../config/db');
const { seedDatabase } = require('../seed/demoData');
const { authenticate, authorize, JWT_SECRET } = require('../middleware/auth');
const adminDashboardController = require('../controllers/adminDashboardController');
const productController = require('../controllers/productController');
const planController = require('../controllers/planController');
const taxController = require('../controllers/taxController');
const discountController = require('../controllers/discountController');
const { User } = require('../models');

async function testHttp() {
  await connectDB();
  await seedDatabase();

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Mount Admin Console routes
  app.get('/api/admin/dashboard', authenticate, authorize(['admin']), adminDashboardController.getDashboardStats);
  app.get('/api/admin/dashboard/recent-products', authenticate, authorize(['admin']), adminDashboardController.getRecentProducts);
  app.get('/api/admin/dashboard/recent-plans', authenticate, authorize(['admin']), adminDashboardController.getRecentPlans);
  app.get('/api/admin/products', authenticate, authorize(['admin']), productController.getAll);
  app.post('/api/admin/products', authenticate, authorize(['admin']), productController.create);
  app.get('/api/admin/plans', authenticate, authorize(['admin']), planController.getAll);
  app.post('/api/admin/plans', authenticate, authorize(['admin']), planController.create);
  app.get('/api/admin/taxes', authenticate, authorize(['admin']), taxController.getAll);
  app.post('/api/admin/taxes', authenticate, authorize(['admin']), taxController.create);
  app.get('/api/admin/discounts', authenticate, authorize(['admin']), discountController.getAll);
  app.post('/api/admin/discounts', authenticate, authorize(['admin']), discountController.create);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(5099, resolve));
  console.log('HTTP Test Server listening on port 5099');

  const adminUser = await User.findOne({ role: 'admin' });
  const staffUser = await User.findOne({ role: 'staff' });

  const adminToken = jwt.sign({ id: adminUser._id, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
  const staffToken = jwt.sign({ id: staffUser._id, role: 'staff' }, JWT_SECRET, { expiresIn: '1h' });

  const fetchJson = (path, options = {}) => {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5099,
        path,
        method: options.method || 'GET',
        headers: options.headers || {}
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, body });
          }
        });
      });
      req.on('error', reject);
      if (options.body) req.write(JSON.stringify(options.body));
      req.end();
    });
  };

  // Test 1: Unauthenticated request to /api/admin/dashboard -> 401
  const resNoAuth = await fetchJson('/api/admin/dashboard');
  if (resNoAuth.status !== 401) throw new Error(`Expected 401, got ${resNoAuth.status}`);
  console.log('  PASS: Unauthenticated request rejected with 401');

  // Test 2: Staff request to /api/admin/dashboard -> 403 Forbidden
  const resStaff = await fetchJson('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${staffToken}` }
  });
  if (resStaff.status !== 403) throw new Error(`Expected 403, got ${resStaff.status}`);
  console.log('  PASS: Staff request to /api/admin/dashboard rejected with 403');

  // Test 3: Admin request to /api/admin/dashboard -> 200 OK
  const resAdmin = await fetchJson('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (resAdmin.status !== 200 || !resAdmin.data.success) {
    throw new Error(`Expected 200 success, got ${resAdmin.status}`);
  }
  console.log('  PASS: Admin request to /api/admin/dashboard returned 200 OK with data');

  // Test 4: Admin request to /api/admin/products with search & filter -> 200 OK
  const resProds = await fetchJson('/api/admin/products?search=CRM&type=Software', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (resProds.status !== 200 || !resProds.data.products) {
    throw new Error(`Expected 200 products list, got ${resProds.status}`);
  }
  console.log('  PASS: Admin request to /api/admin/products with filters returned 200 OK');

  server.close();
  console.log('\nHTTP Integration Tests Passed Successfully!');
}

testHttp().catch(err => {
  console.error('HTTP Test Failed:', err);
  process.exit(1);
});
