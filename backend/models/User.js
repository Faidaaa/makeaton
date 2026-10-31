import mongoose from 'mongoose';

/**
 * Authoritative User Schema for Brightloop.
 * Follows project_execution_plan.md specifications (Section 5.1).
 * 
 * Shared across all four team modules:
 * - Member 1: Authentication, Security & Staff Onboarding
 * - Member 2: Admin Console & Authorization
 * - Member 3: Staff Workspace & Quotations
 * - Member 4: Customer Portal & Invoices
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    fullName: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'staff', 'customer'],
        message: '{VALUE} is not a valid role. Allowed roles: admin, staff, customer',
      },
      default: 'customer',
      index: true,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;
