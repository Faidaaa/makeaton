import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';

// Initialize environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. CORS Configuration using CLIENT_URL
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// 2. Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Health Endpoint (GET /api/health)
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

// 4. API Routes
app.use('/api/auth', authRoutes);

// 5. Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// 5. Ensure the server starts accepting requests only after MongoDB connects
const startServer = async () => {
  try {
    console.log('[Server] Initializing connection to MongoDB Atlas...');
    await connectDB();

    app.listen(PORT, () => {
      console.log(`[Server] Brightloop API server listening on http://localhost:${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
      console.log(`[Server] CORS origin allowed: ${CLIENT_URL}`);
    });
  } catch (error) {
    console.error(`[Server] Startup halted due to MongoDB connection failure: ${error.message}`);
    process.exit(1);
  }
};

startServer();

export default app;

