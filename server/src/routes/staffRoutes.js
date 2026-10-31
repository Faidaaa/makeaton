import express from 'express';
import { getStaffOverview } from '../controllers/staffController.js';

const router = express.Router();

// GET /api/staff/overview
router.get('/overview', getStaffOverview);

export default router;
