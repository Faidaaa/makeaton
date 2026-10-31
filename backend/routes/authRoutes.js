import express from 'express';
import { registerCustomer } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/register — Public customer registration
router.post('/register', registerCustomer);

export default router;

