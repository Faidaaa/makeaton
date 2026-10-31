import { memoryStore } from '../data/store.js';
import { validateLifecycleTransition } from '../utils/lifecycleValidator.js';

export const getSubscriptions = async (req, res, next) => {
  try {
    let { search, status } = req.query;
    if (status === 'undefined' || status === 'null' || status === 'All' || status === '') {
      status = undefined;
    }
    if (search === 'undefined' || search === 'null' || search === '') {
      search = undefined;
    }
    const subscriptions = memoryStore.getSubscriptions({ search, status });
    res.json({ success: true, count: subscriptions.length, data: subscriptions });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = memoryStore.getSubscriptionById(id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

export const createSubscription = async (req, res, next) => {
  try {
    const { customer, plan, items = [], startDate, expiryDate, status = 'Draft', note } = req.body;

    if (!customer || !customer.id) {
      return res.status(400).json({ success: false, message: 'Customer is required.' });
    }
    if (!plan || !plan.id) {
      return res.status(400).json({ success: false, message: 'Plan is required.' });
    }

    const newSub = memoryStore.createSubscription({
      customer,
      plan,
      items,
      subtotal: plan.basePrice || 0,
      taxAmount: Math.round((plan.basePrice || 0) * 0.1 * 100) / 100,
      totalAmount: Math.round((plan.basePrice || 0) * 1.1 * 100) / 100,
      status,
      startDate: startDate || new Date().toISOString(),
      expiryDate: expiryDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      note: note || 'Created by staff'
    });

    res.status(201).json({ success: true, message: 'Subscription created successfully', data: newSub });
  } catch (error) {
    next(error);
  }
};

export const transitionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nextStatus, note, staffName } = req.body;

    const subscription = memoryStore.getSubscriptionById(id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    // Enforce lifecycle state machine validation
    const validation = validateLifecycleTransition(subscription.status, nextStatus);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const updated = memoryStore.updateSubscriptionStatus(id, nextStatus, note, staffName || 'Staff Member');
    res.json({
      success: true,
      message: `Status successfully updated to ${nextStatus}`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const togglePause = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = memoryStore.getSubscriptionById(id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    if (subscription.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Only Active subscriptions can be paused or resumed.'
      });
    }

    const updated = memoryStore.togglePauseSubscription(id);
    res.json({
      success: true,
      message: updated.isPaused ? 'Subscription paused' : 'Subscription resumed',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const renew = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { additionalMonths = 12 } = req.body;

    const subscription = memoryStore.getSubscriptionById(id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    if (subscription.status === 'Closed') {
      return res.status(400).json({
        success: false,
        message: 'Closed subscriptions must be re-opened as a new quotation or draft before renewal.'
      });
    }

    const updated = memoryStore.renewSubscription(id, Number(additionalMonths));
    res.json({
      success: true,
      message: `Subscription successfully renewed for ${additionalMonths} months`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
