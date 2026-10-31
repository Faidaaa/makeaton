/**
 * Admin Seed Script — bootstrap first admin account.
 *
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from backend/.env.
 * Usage:  node scripts/seedAdmin.js
 * npm:    npm run seed:admin
 *
 * This script will NOT overwrite an existing admin account.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Resolve .env from the backend root (one level above scripts/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

import connectDB from '../config/db.js';
import User from '../models/User.js';

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('[SeedAdmin] ❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in backend/.env');
  process.exit(1);
}

const normalizedEmail = ADMIN_EMAIL.toLowerCase().trim();

const seed = async () => {
  try {
    await connectDB();
    console.log('[SeedAdmin] Connected to MongoDB.');

    // Check if admin already exists
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      if (existing.role === 'admin') {
        console.log(`[SeedAdmin] ℹ️  Admin already exists: ${normalizedEmail}`);
      } else {
        // Promote to admin if somehow the account exists with a different role
        existing.role = 'admin';
        await existing.save();
        console.log(`[SeedAdmin] ✅ Promoted existing user to admin: ${normalizedEmail}`);
      }
    } else {
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      await User.create({
        email: normalizedEmail,
        passwordHash,
        fullName: 'System Admin',
        role: 'admin',
      });
      console.log(`[SeedAdmin] ✅ Admin account created: ${normalizedEmail}`);
    }
  } catch (err) {
    console.error('[SeedAdmin] ❌ Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[SeedAdmin] Disconnected from MongoDB.');
    process.exit(0);
  }
};

seed();

