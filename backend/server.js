const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('./config/db');
const { authenticate, authorize } = require('./middleware/auth');

// Controllers
const authController = require('./controllers/authController');
const productController = require('./controllers/productController');
const planController = require('./controllers/planController');
const templateController = require('./controllers/templateController');
const subscriptionController = require('./controllers/subscriptionController');
const discountController = require('./controllers/discountController');
const taxController = require('./controllers/taxController');
const invoiceController = require('./controllers/invoiceController');
const paymentController = require('./controllers/paymentController');
const analyticsController = require('./controllers/analyticsController');
const adminDashboardController = require('./controllers/adminDashboardController');

const app = express();
const PORT = process.env.PORT || 5001;

// Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Resolve Frontend directory (checks parent /frontend, local /frontend, or /public)
const frontendCandidates = [
  path.resolve(__dirname, '..', 'frontend'),
  path.resolve(__dirname, 'frontend'),
  path.resolve(__dirname, 'public'),
  path.resolve(__dirname, '..', 'public')
];
const frontendDir = frontendCandidates.find(dir => fs.existsSync(dir)) || path.join(__dirname, 'public');

// Serve Static Frontend Assets (HTML, CSS, JS)
app.use(express.static(frontendDir));

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// ====================================================
// MEMBER 2: ADMIN CONSOLE, PRODUCTS, PLANS, TAXES & DISCOUNTS
// ====================================================

// Admin Dashboard Telemetry Endpoints
app.get('/api/admin/dashboard', authenticate, authorize(['admin']), adminDashboardController.getDashboardStats);
app.get('/api/admin/dashboard/recent-products', authenticate, authorize(['admin']), adminDashboardController.getRecentProducts);
app.get('/api/admin/dashboard/recent-plans', authenticate, authorize(['admin']), adminDashboardController.getRecentPlans);

// Admin Product Catalog & Brand Variants Management
app.get('/api/admin/products', authenticate, authorize(['admin']), productController.getAll);
app.get('/api/admin/products/:id', authenticate, authorize(['admin']), productController.getById);
app.post('/api/admin/products', authenticate, authorize(['admin']), productController.create);
app.put('/api/admin/products/:id', authenticate, authorize(['admin']), productController.update);
app.delete('/api/admin/products/:id', authenticate, authorize(['admin']), productController.delete);

// Admin Subscription Plans Management
app.get('/api/admin/plans', authenticate, authorize(['admin']), planController.getAll);
app.get('/api/admin/plans/:id', authenticate, authorize(['admin']), planController.getById);
app.post('/api/admin/plans', authenticate, authorize(['admin']), planController.create);
app.put('/api/admin/plans/:id', authenticate, authorize(['admin']), planController.update);
app.delete('/api/admin/plans/:id', authenticate, authorize(['admin']), planController.delete);

// Admin Tax Rules Engine
app.get('/api/admin/taxes', authenticate, authorize(['admin']), taxController.getAll);
app.get('/api/admin/taxes/:id', authenticate, authorize(['admin']), taxController.getById);
app.post('/api/admin/taxes', authenticate, authorize(['admin']), taxController.create);
app.put('/api/admin/taxes/:id', authenticate, authorize(['admin']), taxController.update);
app.delete('/api/admin/taxes/:id', authenticate, authorize(['admin']), taxController.delete);

// Admin Discount Rules Engine
app.get('/api/admin/discounts', authenticate, authorize(['admin']), discountController.getAll);
app.get('/api/admin/discounts/:id', authenticate, authorize(['admin']), discountController.getById);
app.post('/api/admin/discounts', authenticate, authorize(['admin']), discountController.create);
app.put('/api/admin/discounts/:id', authenticate, authorize(['admin']), discountController.update);
app.delete('/api/admin/discounts/:id', authenticate, authorize(['admin']), discountController.delete);

// 1. Auth & Users (Scene 2)
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', authenticate, authController.me);
app.post('/api/auth/forgot-password', authController.forgotPassword);
app.post('/api/auth/reset-password', authController.resetPassword);

// Staff & Customer Management
app.get('/api/users/staff', authenticate, authorize(['admin']), authController.listStaff);
app.post('/api/users/staff', authenticate, authorize(['admin']), authController.createStaff); // Admin only can add staff
app.get('/api/users/customers', authenticate, authorize(['admin', 'staff']), authController.listCustomers);

// 2. Products & Variants (Public & General Endpoints)
app.get('/api/products', productController.getAll);
app.get('/api/products/:id', productController.getById);
app.post('/api/products', authenticate, authorize(['admin']), productController.create);
app.put('/api/products/:id', authenticate, authorize(['admin']), productController.update);
app.delete('/api/products/:id', authenticate, authorize(['admin']), productController.delete);

// 3. Plans & Cadences (Public & General Endpoints)
app.get('/api/plans', planController.getAll);
app.get('/api/plans/:id', planController.getById);
app.post('/api/plans', authenticate, authorize(['admin']), planController.create);
app.put('/api/plans/:id', authenticate, authorize(['admin']), planController.update);
app.delete('/api/plans/:id', authenticate, authorize(['admin']), planController.delete);

// 4. Quotation Templates (Scene 4)
app.get('/api/templates', templateController.getAll);
app.get('/api/templates/:id', templateController.getById);
app.post('/api/templates', authenticate, authorize(['admin', 'staff']), templateController.create);
app.delete('/api/templates/:id', authenticate, authorize(['admin', 'staff']), templateController.delete);

// 5. Subscriptions & Quotes (Scene 4)
app.get('/api/subscriptions', authenticate, subscriptionController.getAll);
app.get('/api/subscriptions/:id', authenticate, subscriptionController.getById);
app.post('/api/subscriptions', authenticate, subscriptionController.create);
app.patch('/api/subscriptions/:id/status', authenticate, subscriptionController.updateStatus);
app.post('/api/subscriptions/:id/renew', authenticate, subscriptionController.renew);

// 6. Discount Rules (Scene 6)
app.get('/api/discounts', authenticate, discountController.getAll);
app.get('/api/discounts/:id', authenticate, discountController.getById);
app.post('/api/discounts', authenticate, authorize(['admin']), discountController.create); // Only admin can create discounts
app.put('/api/discounts/:id', authenticate, authorize(['admin']), discountController.update);
app.post('/api/discounts/validate', discountController.validateRule);
app.delete('/api/discounts/:id', authenticate, authorize(['admin']), discountController.delete);

// 7. Tax Rules (Scene 5)
app.get('/api/taxes', taxController.getAll);
app.get('/api/taxes/:id', taxController.getById);
app.post('/api/taxes', authenticate, authorize(['admin']), taxController.create);
app.put('/api/taxes/:id', authenticate, authorize(['admin']), taxController.update);
app.delete('/api/taxes/:id', authenticate, authorize(['admin']), taxController.delete);

// 8. Billing Day & Invoicing (Scene 5)
app.post('/api/invoices/billing-day', authenticate, authorize(['admin', 'staff']), invoiceController.runBillingDay);
app.get('/api/invoices', authenticate, invoiceController.getAll);
app.get('/api/invoices/:id', authenticate, invoiceController.getById);
app.patch('/api/invoices/:id/status', authenticate, authorize(['admin', 'staff']), invoiceController.updateStatus);
app.post('/api/invoices/:id/send', authenticate, authorize(['admin', 'staff']), invoiceController.sendInvoice);

// 9. Payments (Scene 7)
app.get('/api/payments', authenticate, paymentController.getAll);
app.post('/api/payments', authenticate, paymentController.recordPayment);

// 10. Finance Lead Analytics (Scene 8)
app.get('/api/analytics/finance-summary', authenticate, authorize(['admin', 'staff']), analyticsController.getFinanceSummary);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Brightloop Subscription Management System - Admin Console',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Fallback route for SPA frontend navigation
app.get('*', (req, res) => {
  const indexFile = path.join(frontendDir, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(404).send('Brightloop Frontend index.html not found');
  }
});

// Start Server & Connect Database
const startServer = async () => {
  await connectDB();

  let targetPort = parseInt(PORT, 10) || 5000;

  const tryListen = (portToTry) => {
    const serverInstance = app.listen(portToTry, () => {
      console.log(`====================================================`);
      console.log(` Brightloop Subscription Management System Running!`);
      console.log(` Local URL: http://localhost:${portToTry}`);
      console.log(` Health Check: http://localhost:${portToTry}/api/health`);
      console.log(` Database: Production-ready clean state (no demo data)`);
      console.log(`====================================================`);
    });

    serverInstance.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Port Warning] Port ${portToTry} is occupied or reserved. Trying port ${portToTry + 1}...`);
        tryListen(portToTry + 1);
      } else {
        console.error('Server startup error:', err);
      }
    });
  };

  tryListen(targetPort);
};

startServer();

module.exports = app;
