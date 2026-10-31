import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { isPasswordValid, getPasswordErrors } from '../utils/passwordValidator.js';

/**
 * POST /api/admin/create-staff
 * Admin-only: Create a new staff account.
 * Body: { email, password, fullName? }
 */
export const createStaff = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // 2. Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 3. Validate password strength
    if (!isPasswordValid(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements.',
        errors: getPasswordErrors(password),
      });
    }

    // 4. Check for duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // 5. Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 6. Create user with forced 'staff' role
    const staffUser = await User.create({
      email: normalizedEmail,
      passwordHash,
      fullName: fullName ? fullName.trim() : '',
      role: 'staff',
    });

    // 7. Return safe user object (no passwordHash)
    res.status(201).json({
      success: true,
      message: 'Staff account created successfully.',
      user: {
        id: staffUser._id,
        email: staffUser.email,
        fullName: staffUser.fullName,
        role: staffUser.role,
        createdAt: staffUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

