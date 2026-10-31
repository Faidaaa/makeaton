import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

import connectDB from './config/db.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { protect } from './middleware/authMiddleware.js';
import { requireRole } from './middleware/roleMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Controllers from Member 2 (loaded via CJS interoperability)
let productController, planController, templateController, subscriptionController;
let discountController, taxController, invoiceController, paymentController, analyticsController, adminDashboardController;
let userManagementController;

try {
  productController = require('./controllers/productController');
  planController = require('./controllers/planController');
  templateController = require('./controllers/templateController');
  subscriptionController = require('./controllers/subscriptionController');
  discountController = require('./controllers/discountController');
  taxController = require('./controllers/taxController');
  invoiceController = require('./controllers/invoiceController');
  paymentController = require('./controllers/paymentController');
  analyticsController = require('./controllers/analyticsController');
  adminDashboardController = require('./controllers/adminDashboardController');
  userManagementController = require('./controllers/authController');
} catch (e) {
  console.warn('[Server] Note: Some CJS controllers not loaded:', e.message);
}

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development ports (Vite 5173, etc.)
      callback(null, true);
    },
    credentials: true,
  })
);

// 2. Body Parser & Cookie Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 3. Static Assets (for vanilla admin console if accessed)
const frontendCandidates = [
  path.resolve(__dirname, '..', 'frontend'),
  path.resolve(__dirname, 'frontend'),
  path.resolve(__dirname, 'public'),
];
const frontendDir = frontendCandidates.find((dir) => fs.existsSync(dir));
if (frontendDir) {
  app.use(express.static(frontendDir));
}

// 4. Health Endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    status: 'healthy',
    service: 'brightloop-backend',
    database: {
      status: dbStatusMap[dbState] || 'unknown',
      name: mongoose.connection.name || 'brightloop',
      host: mongoose.connection.host || 'remote',
    },
    uptime: `${process.uptime().toFixed(1)}s`,
    timestamp: new Date().toISOString(),
  });
});

// 5. Authentication & Administrative RBAC Routes (Member 1)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// 6. User Management Routes (Admin & Staff)
if (userManagementController) {
  if (userManagementController.listStaff) {
    app.get('/api/users/staff', protect, requireRole(['admin']), userManagementController.listStaff);
    app.post('/api/users/staff', protect, requireRole(['admin']), userManagementController.createStaff);
  }
  if (userManagementController.listCustomers) {
    app.get('/api/users/customers', protect, requireRole(['admin', 'staff']), userManagementController.listCustomers);
  }
}

// 7. Member 2 Modules (Products, Plans, Taxes, Discounts, Invoices, Analytics)
if (adminDashboardController) {
  app.get('/api/admin/dashboard', protect, requireRole(['admin']), adminDashboardController.getDashboardStats);
  app.get('/api/admin/dashboard/recent-products', protect, requireRole(['admin']), adminDashboardController.getRecentProducts);
  app.get('/api/admin/dashboard/recent-plans', protect, requireRole(['admin']), adminDashboardController.getRecentPlans);
}

if (productController) {
  app.get('/api/admin/products', protect, requireRole(['admin']), productController.getAll);
  app.post('/api/admin/products', protect, requireRole(['admin']), productController.create);
  app.put('/api/admin/products/:id', protect, requireRole(['admin']), productController.update);
  app.delete('/api/admin/products/:id', protect, requireRole(['admin']), productController.delete);

  app.get('/api/products', productController.getAll);
  app.get('/api/products/:id', productController.getById);
}

if (planController) {
  app.get('/api/admin/plans', protect, requireRole(['admin']), planController.getAll);
  app.post('/api/admin/plans', protect, requireRole(['admin']), planController.create);
  app.put('/api/admin/plans/:id', protect, requireRole(['admin']), planController.update);
  app.delete('/api/admin/plans/:id', protect, requireRole(['admin']), planController.delete);

  app.get('/api/plans', planController.getAll);
  app.get('/api/plans/:id', planController.getById);
}

if (taxController) {
  app.get('/api/admin/taxes', protect, requireRole(['admin']), taxController.getAll);
  app.post('/api/admin/taxes', protect, requireRole(['admin']), taxController.create);
  app.put('/api/admin/taxes/:id', protect, requireRole(['admin']), taxController.update);
  app.delete('/api/admin/taxes/:id', protect, requireRole(['admin']), taxController.delete);

  app.get('/api/taxes', taxController.getAll);
  app.get('/api/taxes/:id', taxController.getById);
}

if (discountController) {
  app.get('/api/admin/discounts', protect, requireRole(['admin']), discountController.getAll);
  app.post('/api/admin/discounts', protect, requireRole(['admin']), discountController.create);
  app.put('/api/admin/discounts/:id', protect, requireRole(['admin']), discountController.update);
  app.delete('/api/admin/discounts/:id', protect, requireRole(['admin']), discountController.delete);

  app.get('/api/discounts', protect, discountController.getAll);
  app.post('/api/discounts/validate', discountController.validateRule);
}

if (templateController) {
  app.get('/api/templates', templateController.getAll);
  app.get('/api/templates/:id', templateController.getById);
  app.post('/api/templates', protect, requireRole(['admin', 'staff']), templateController.create);
}

if (subscriptionController) {
  app.get('/api/subscriptions', protect, subscriptionController.getAll);
  app.get('/api/subscriptions/:id', protect, subscriptionController.getById);
  app.post('/api/subscriptions', protect, subscriptionController.create);
  app.patch('/api/subscriptions/:id/status', protect, subscriptionController.updateStatus);
}

if (invoiceController) {
  app.get('/api/invoices', protect, invoiceController.getAll);
  app.get('/api/invoices/:id', protect, invoiceController.getById);
  app.post('/api/invoices/billing-day', protect, requireRole(['admin', 'staff']), invoiceController.runBillingDay);
}

if (paymentController) {
  app.get('/api/payments', protect, paymentController.getAll);
  app.post('/api/payments', protect, paymentController.recordPayment);
}

if (analyticsController) {
  app.get('/api/analytics/finance-summary', protect, requireRole(['admin', 'staff']), analyticsController.getFinanceSummary);
}

// 8. Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// 9. Server Initialization
const startServer = async () => {
  try {
    console.log('[Server] Initializing connection to MongoDB Atlas...');
    await connectDB();

    app.listen(PORT, () => {
      console.log(`[Server] Brightloop API server listening on http://localhost:${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error(`[Server] Startup halted: ${error.message}`);
    process.exit(1);
  }
};

startServer();

export default app;
