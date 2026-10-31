import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import quotationRoutes from './routes/quotationRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import catalogMockRoutes from './routes/catalogMockRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Request logger for easy debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Brightloop Subscription & Quotation API (Member 3)',
    timestamp: new Date()
  });
});

// Member 3 Module Routes
app.use('/api/staff', staffRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Catalog & Shared Data Provider (Fallback until Member 2 endpoints are connected)
app.use('/api/catalog', catalogMockRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Connect to MongoDB Atlas (or graceful in-memory fallback for local testing)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/brightloop';

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log(' Connected to MongoDB'))
  .catch((err) => {
    console.warn(' MongoDB connection note: Operating in graceful local mode (MongoDB not connected). In-memory persistence active.');
  });

app.listen(PORT, () => {
  console.log(` Brightloop API Server running on http://localhost:${PORT}`);
  console.log(` Staff Endpoints: http://localhost:${PORT}/api/staff/overview`);
  console.log(` Quotation Endpoints: http://localhost:${PORT}/api/quotations`);
  console.log(` Subscription Endpoints: http://localhost:${PORT}/api/subscriptions`);
});

export default app;
