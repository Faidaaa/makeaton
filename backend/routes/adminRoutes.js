import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { createStaff } from '../controllers/adminController.js';

const router = express.Router();

/**
 * POST /api/admin/create-staff
 * Admin-only: Creates a new staff account.
 */
router.post('/create-staff', protect, requireRole(['admin']), createStaff);

export default router;

