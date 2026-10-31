import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Reusable Authentication Middleware.
 * Verifies JWT from HTTP-only cookie ('token') or Authorization Bearer header.
 * Extracts user ID and role, fetches sanitized user from DB, and attaches to req.user.
 */
export const protect = async (req, res, next) => {
  let token = null;

  // 1. Check HTTP-only cookie first (preferred)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fall back to Authorization Bearer header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user in MongoDB and exclude passwordHash
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User no longer exists.',
      });
    }

    // Check account status if isActive exists
    if (user.isActive !== undefined && !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact an administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Invalid token signature.',
    });
  }
};

