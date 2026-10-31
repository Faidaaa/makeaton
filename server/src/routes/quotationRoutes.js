import express from 'express';
import {
  getQuotations,
  getTemplates,
  getQuotationById,
  createQuotation,
  updateQuotation,
  convertQuotationToSubscription
} from '../controllers/quotationController.js';

const router = express.Router();

router.get('/', getQuotations);
router.get('/templates', getTemplates);
router.get('/:id', getQuotationById);
router.post('/', createQuotation);
router.put('/:id', updateQuotation);
router.post('/:id/convert', convertQuotationToSubscription);

export default router;
