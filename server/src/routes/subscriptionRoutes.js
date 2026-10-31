import express from 'express';
import {
  getSubscriptions,
  getSubscriptionById,
  createSubscription,
  transitionStatus,
  togglePause,
  renew
} from '../controllers/subscriptionController.js';

const router = express.Router();

router.get('/', getSubscriptions);
router.get('/:id', getSubscriptionById);
router.post('/', createSubscription);
router.patch('/:id/transition', transitionStatus);
router.post('/:id/pause', togglePause);
router.post('/:id/renew', renew);

export default router;
