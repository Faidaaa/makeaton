import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { isPasswordValid, getPasswordErrors } from '../utils/passwordValidator.js';

/**
 * Cookie options helper for consistent JWT session management.
 */
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/',
});

/**
 * @desc    Register a new customer account
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerCustomer = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      res.status(400);
      throw new Error('Email and password are required.');
    }

    // 2. Normalize and validate email format
    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      res.status(400);
      throw new Error('Please provide a valid email address.');
    }

    // 3. Validate password strength (server-side enforcement)
    if (!isPasswordValid(password)) {
      const passwordErrors = getPasswordErrors(password);
      res.status(400);
      throw new Error(`Password does not meet security requirements: ${passwordErrors.join(' ')}`);
    }

    // 4. Check for existing user with this email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409);
      throw new Error('An account with this email address already exists.');
    }

    // 5. Hash password with bcryptjs (10 salt rounds)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 6. Create user — force role to 'customer' regardless of input
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      role: 'customer',
    });

    // 7. Return success response (never expose passwordHash)
    res.status(201).json({
      success: true,
      message: 'Customer account registered successfully.',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get JWT session token in HTTP-only cookie
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // 2. Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // 3. Find user in MongoDB
    const user = await User.findOne({ email: normalizedEmail });

    // 4. Verify user and password with generic error message to prevent enumeration
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 5. Check account status if isActive field exists
    if (user.isActive !== undefined && !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact an administrator.',
      });
    }

    // 6. Generate signed JWT containing user ID and role
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 7. Set HTTP-only cookie
    res.cookie('token', token, getCookieOptions());

    // 8. Return safe user information (never expose passwordHash)
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user details
 * @route   GET /api/auth/me
 * @access  Private (Requires Protect Middleware)
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    // req.user is attached by the protect middleware
    res.status(200).json({
      success: true,
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log out current user / invalidate session cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logoutUser = async (req, res, next) => {
  try {
    // Clear the HTTP-only cookie
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
