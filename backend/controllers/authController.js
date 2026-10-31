const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWT_SECRET, validatePassword } = require('../middleware/auth');

exports.register = async (req, res) => {
  try {
    const { name, email, password, company, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    // Password validation rule from Odoo hackathon problem statement:
    // "the password must be more than eight characters, with an uppercase letter, a lowercase letter and a special character."
    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) {
      return res.status(400).json({ success: false, message: pwdCheck.message });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Each email can belong to only one account. This email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: 'customer', // Public registration creates customer accounts
      company: company ? company.trim() : '',
      phone: phone ? phone.trim() : ''
    });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Brightloop Software.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        phone: user.phone
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user', error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Don't disclose existence for security, but acknowledge
      return res.json({
        success: true,
        message: 'If that email is registered, a password reset link has been dispatched to your inbox.'
      });
    }

    const resetToken = 'reset_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: expires
    });

    return res.json({
      success: true,
      message: `Reset link dispatched to registered email (${user.email}).`,
      // For demo simulation / testing:
      simulationResetToken: resetToken,
      resetUrl: `/reset-password?token=${resetToken}`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Password reset request failed', error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    const pwdCheck = validatePassword(newPassword);
    if (!pwdCheck.valid) {
      return res.status(400).json({ success: false, message: pwdCheck.message });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gte: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset link.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    return res.json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Password reset failed', error: err.message });
  }
};

// Admin only: list staff members
exports.listStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['admin', 'staff'] } });
    return res.json({
      success: true,
      staff: staff.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email,
        role: s.role,
        company: s.company,
        createdAt: s.createdAt
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to list staff', error: err.message });
  }
};

// Admin only: add staff member
exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, role, company, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) {
      return res.status(400).json({ success: false, message: pwdCheck.message });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This email is already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newStaff = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'staff',
      company: company ? company.trim() : 'Brightloop Software',
      phone: phone ? phone.trim() : ''
    });

    return res.status(201).json({
      success: true,
      message: `Staff member ${newStaff.name} created successfully!`,
      staff: {
        id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create staff member', error: err.message });
  }
};

// Get all customers (for admin & staff dropdowns)
exports.listCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' });
    return res.json({
      success: true,
      customers: customers.map(c => ({
        id: c._id,
        name: c.name,
        email: c.email,
        company: c.company,
        phone: c.phone
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to list customers', error: err.message });
  }
};
