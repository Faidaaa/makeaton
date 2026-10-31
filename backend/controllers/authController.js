import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { isPasswordValid, getPasswordErrors } from '../utils/passwordValidator.js';

/**
 * @desc    Register a new customer account
 * @route   POST /api/auth/register
 * @access  Public
 *
 * Accepts: { email, password }
 * Forces role to 'customer' — never trusts client-supplied role.
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

