import { memoryStore } from '../data/store.js';
import { calculateQuotationTotals } from '../utils/quotationCalculator.js';

export const getQuotations = async (req, res, next) => {
  try {
    let { search, status } = req.query;
    if (status === 'undefined' || status === 'null' || status === 'All' || status === '') {
      status = undefined;
    }
    if (search === 'undefined' || search === 'null' || search === '') {
      search = undefined;
    }
    const quotations = memoryStore.getQuotations({ search, status });
    res.json({ success: true, count: quotations.length, data: quotations });
  } catch (error) {
    next(error);
  }
};

export const getTemplates = async (req, res, next) => {
  try {
    const templates = memoryStore.getTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
};

export const getQuotationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quotation = memoryStore.getQuotationById(id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }
    res.json({ success: true, data: quotation });
  } catch (error) {
    next(error);
  }
};

export const createQuotation = async (req, res, next) => {
  try {
    const { customer, plan, items = [], startDate, expiryDate, paymentTerms, isTemplate, templateName, notes, defaultTaxRate = 10 } = req.body;

    if (!customer || !customer.id || !customer.name) {
      return res.status(400).json({ success: false, message: 'Valid customer is required.' });
    }
    if (!plan || !plan.id) {
      return res.status(400).json({ success: false, message: 'Valid subscription plan is required.' });
    }
    if (!expiryDate) {
      return res.status(400).json({ success: false, message: 'Quotation expiry date is required.' });
    }

    // Run safe financial calculations
    const calculations = calculateQuotationTotals(items, plan.basePrice || 0, defaultTaxRate);

    const quotationData = {
      customer,
      plan: {
        ...plan,
        basePrice: calculations.planBasePrice
      },
      startDate: startDate || new Date().toISOString(),
      expiryDate,
      paymentTerms: paymentTerms || 'Net 30',
      items: calculations.items,
      subtotal: calculations.subtotal,
      taxAmount: calculations.totalTax,
      totalAmount: calculations.grandTotal,
      status: 'Draft',
      isTemplate: Boolean(isTemplate),
      templateName: templateName || '',
      notes: notes || ''
    };

    const created = memoryStore.createQuotation(quotationData);
    res.status(201).json({ success: true, message: 'Quotation created successfully', data: created });
  } catch (error) {
    next(error);
  }
};

export const updateQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = memoryStore.getQuotationById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    // Permission check: Can only edit Draft or Sent quotations
    if (existing.status === 'Accepted' || existing.status === 'Expired') {
      return res.status(400).json({
        success: false,
        message: `Cannot edit quotation with status "${existing.status}". It is locked.`
      });
    }

    const { items, plan, defaultTaxRate = 10, ...rest } = req.body;
    let calculations = null;

    if (items || plan) {
      const itemsToCalculate = items !== undefined ? items : existing.items;
      const planPrice = plan?.basePrice !== undefined ? plan.basePrice : existing.plan.basePrice;
      calculations = calculateQuotationTotals(itemsToCalculate, planPrice, defaultTaxRate);
    }

    const updatePayload = {
      ...rest,
      ...(calculations && {
        items: calculations.items,
        subtotal: calculations.subtotal,
        taxAmount: calculations.totalTax,
        totalAmount: calculations.grandTotal
      })
    };

    const updated = memoryStore.updateQuotation(id, updatePayload);
    res.json({ success: true, message: 'Quotation updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

export const convertQuotationToSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quotation = memoryStore.getQuotationById(id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    // Check expiry
    if (new Date(quotation.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'Quotation has expired and cannot be converted.' });
    }

    // Mark quote as Accepted
    memoryStore.updateQuotation(id, { status: 'Accepted' });

    // Calculate expiry (1 month or 1 year based on billing frequency)
    const startDate = new Date();
    const expiryDate = new Date();
    if (quotation.plan.billingFrequency === 'Annual') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    // Create Subscription in 'Confirmed' state
    const newSub = memoryStore.createSubscription({
      quotationNumber: quotation.quotationNumber,
      customer: quotation.customer,
      plan: quotation.plan,
      items: quotation.items,
      subtotal: quotation.subtotal,
      taxAmount: quotation.taxAmount,
      totalAmount: quotation.totalAmount,
      status: 'Confirmed',
      startDate: startDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      renewalDate: expiryDate.toISOString(),
      note: `Generated from Quotation ${quotation.quotationNumber}`
    });

    res.status(201).json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} successfully converted to subscription ${newSub.subscriptionNumber}!`,
      data: newSub
    });
  } catch (error) {
    next(error);
  }
};
