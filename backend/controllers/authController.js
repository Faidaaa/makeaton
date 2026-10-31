import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { isPasswordValid, getPasswordErrors } from '../utils/passwordValidator.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

/** Cookie settings matching Task 5 specifications */
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/',
});

/**
 * Register a new customer account
 * POST /api/auth/register
 */
export const registerCustomer = async (req, res, next) => {
  try {
    const { email, password, fullName, name, company, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (!isPasswordValid(password)) {
      const passwordErrors = getPasswordErrors(password);
      return res.status(400).json({
        success: false,
        message: `Password does not meet security requirements: ${passwordErrors.join(' ')}`,
        errors: passwordErrors,
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      fullName: (fullName || name || '').trim(),
      name: (name || fullName || '').trim(),
      company: (company || '').trim(),
      phone: (phone || '').trim(),
      role: 'customer',
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Brightloop.',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName || user.name,
        name: user.name || user.fullName,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** Alias for compatibility */
export const register = registerCustomer;

/**
 * Log in with email and password
 * POST /api/auth/login
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const hashToCompare = user.passwordHash || user.password;
    const isMatch = hashToCompare ? await bcrypt.compare(password, hashToCompare) : false;

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (user.isActive !== undefined && !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact an administrator.',
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, name: user.name || user.fullName },
      process.env.JWT_SECRET || 'brightloop_jwt_secret',
      { expiresIn: '24h' }
    );

    res.cookie('token', token, getCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName || user.name,
        name: user.name || user.fullName,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** Alias for compatibility */
export const login = loginUser;

/**
 * Current user profile
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      id: req.user._id,
      email: req.user.email,
      name: req.user.name || req.user.fullName,
      fullName: req.user.fullName || req.user.name,
      role: req.user.role,
    });
  } catch (error) {
    next(error);
  }
};

/** Alias for compatibility */
export const me = getCurrentUser;

/**
 * Log out user / clear cookie
 * POST /api/auth/logout
 */
export const logoutUser = async (req, res, next) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/** Alias for compatibility */
export const logout = logoutUser;

/**
 * Forgot password request
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
      await user.save();

      try {
        await sendPasswordResetEmail(user.email, resetToken);
      } catch (emailErr) {
        console.error('[Auth] Failed to dispatch reset email:', emailErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been dispatched.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using token
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required.',
      });
    }

    if (!isPasswordValid(password)) {
      const passwordErrors = getPasswordErrors(password);
      return res.status(400).json({
        success: false,
        message: `Password does not meet requirements: ${passwordErrors.join(' ')}`,
        errors: passwordErrors,
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid, expired, or has already been used.',
      });
    }

    const saltRounds = 12;
    user.passwordHash = await bcrypt.hash(password, saltRounds);
    user.password = user.passwordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully. You may now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List staff members (admin only)
 * GET /api/users/staff
 */
export const listStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ role: { $in: ['admin', 'staff'] } }).select('-passwordHash -password');
    res.status(200).json({
      success: true,
      staff: staff.map((s) => ({
        id: s._id,
        name: s.name || s.fullName,
        email: s.email,
        role: s.role,
        company: s.company,
        createdAt: s.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create staff member (admin only)
 * POST /api/admin/create-staff or POST /api/users/staff
 */
export const createStaff = async (req, res, next) => {
  try {
    const { name, fullName, email, password, role, company, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    if (!isPasswordValid(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements.',
        errors: getPasswordErrors(password),
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: 'This email is already in use.' });
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const newStaff = await User.create({
      name: (name || fullName || '').trim(),
      fullName: (fullName || name || '').trim(),
      email: cleanEmail,
      passwordHash,
      password: passwordHash,
      role: role === 'admin' ? 'admin' : 'staff',
      company: company ? company.trim() : 'Brightloop Software',
      phone: phone ? phone.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: `Staff account created successfully!`,
      user: {
        id: newStaff._id,
        name: newStaff.name,
        fullName: newStaff.fullName,
        email: newStaff.email,
        role: newStaff.role,
        createdAt: newStaff.createdAt,
      },
      staff: {
        id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List all customers (for admin & staff dropdowns)
 * GET /api/users/customers
 */
export const listCustomers = async (req, res, next) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('-passwordHash -password');
    res.status(200).json({
      success: true,
      customers: customers.map((c) => ({
        id: c._id,
        name: c.name || c.fullName,
        email: c.email,
        company: c.company,
        phone: c.phone,
      })),
    });
  } catch (err) {
    next(err);
  }
};
