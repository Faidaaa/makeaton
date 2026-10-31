import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerCustomer,
  loginUser,
  getCurrentUser,
  logoutUser,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Rate Limiter for Login Endpoint.
 * Prevents brute force credential attacks: max 10 attempts per 15 minutes per IP.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate Limiter for Forgot Password Endpoint.
 * Prevents email flooding: max 5 requests per 15 minutes per IP.
 */
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public authentication routes
router.post('/register', registerCustomer);
router.post('/login', loginLimiter, loginUser);
router.post('/logout', logoutUser);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

// Protected session route
router.get('/me', protect, getCurrentUser);

export default router;
