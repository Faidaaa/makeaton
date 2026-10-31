const { Subscription, Plan, Product, User, Discount, TaxRule } = require('../models');

// Helper to generate readable sequential subscription numbers like SUB-2026-0001
const generateSubscriptionNumber = async () => {
  const count = await Subscription.countDocuments();
  const year = new Date().getFullYear();
  return `SUB-${year}-${String(count + 1).padStart(4, '0')}`;
};

exports.getAll = async (req, res) => {
  try {
    let filter = {};

    // Customer role can ONLY see their own subscriptions
    if (req.user.role === 'customer') {
      filter.customerId = req.user._id;
    } else {
      // Admin/Staff filters
      if (req.query.customerId) filter.customerId = req.query.customerId;
      if (req.query.status) filter.status = req.query.status;
      if (req.query.planId) filter.planId = req.query.planId;
    }

    const subscriptions = await Subscription.find(filter, { createdAt: -1 });

    // Populate customer and plan data
    const users = await User.find();
    const plans = await Plan.find();
    const userMap = {};
    const planMap = {};
    users.forEach(u => { userMap[String(u._id)] = { id: u._id, name: u.name, email: u.email, company: u.company }; });
    plans.forEach(p => { planMap[String(p._id)] = p; });

    const enriched = subscriptions.map(s => ({
      ...s,
      customer: userMap[String(s.customerId)] || null,
      plan: planMap[String(s.planId)] || null
    }));

    return res.json({ success: true, count: enriched.length, subscriptions: enriched });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve subscriptions', error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });

    // Customer security check
    if (req.user.role === 'customer' && String(sub.customerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied to this subscription.' });
    }

    const customer = await User.findById(sub.customerId);
    const plan = await Plan.findById(sub.planId);
    const discount = sub.appliedDiscountId ? await Discount.findById(sub.appliedDiscountId) : null;

    return res.json({
      success: true,
      subscription: {
        ...sub,
        customer: customer ? { id: customer._id, name: customer.name, email: customer.email, company: customer.company } : null,
        plan,
        discount
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch subscription', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      customerId,
      planId,
      quotationTemplateId,
      startDate,
      expiryDate,
      paymentTerms,
      lines,
      discountCode,
      notes
    } = req.body;

    const targetCustomerId = req.user.role === 'customer' ? req.user._id : (customerId || req.user._id);

    if (!targetCustomerId || !planId || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer, Plan, and at least one product line item are required.'
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Selected plan not found' });

    // Calculate totals across lines
    let subtotal = 0;
    let taxTotal = 0;
    let totalQty = 0;

    const processedLines = lines.map(line => {
      const qty = Number(line.quantity) || 1;
      const price = Number(line.unitPrice) || 0;
      const lineTaxRate = Number(line.taxRate) || 0;
      const lineSubtotal = qty * price;
      const lineTax = (lineSubtotal * lineTaxRate) / 100;
      const lineAmount = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      taxTotal += lineTax;
      totalQty += qty;

      return {
        productId: line.productId || null,
        productName: line.productName || 'Custom Line Item',
        variant: line.variant || 'Standard Edition',
        quantity: qty,
        unitPrice: price,
        taxRate: lineTaxRate,
        taxAmount: Number(lineTax.toFixed(2)),
        amount: Number(lineAmount.toFixed(2))
      };
    });

    // Check plan minimum quantity
    if (plan.minQuantity && totalQty < plan.minQuantity) {
      return res.status(400).json({
        success: false,
        message: `Plan '${plan.name}' requires a minimum quantity of ${plan.minQuantity}.`
      });
    }

    // Process optional discount code
    let discountTotal = 0;
    let appliedDiscountId = null;

    if (discountCode) {
      const discount = await Discount.findOne({ code: discountCode.toUpperCase().trim(), isActive: true });
      if (discount) {
        let isEligible = true;
        if (discount.usageLimit > 0 && discount.usageCount >= discount.usageLimit) isEligible = false;
        if (discount.minQuantity > 0 && totalQty < discount.minQuantity) isEligible = false;
        if (discount.minPurchaseAmount > 0 && subtotal < discount.minPurchaseAmount) isEligible = false;

        if (isEligible) {
          appliedDiscountId = discount._id;
          if (discount.type === 'percentage') {
            discountTotal = (subtotal * discount.value) / 100;
          } else {
            discountTotal = Math.min(subtotal, discount.value);
          }
          // Increment discount usage
          await Discount.findByIdAndUpdate(discount._id, { $inc: { usageCount: 1 } });
        }
      }
    }

    const netSubtotal = Math.max(0, subtotal - discountTotal);
    // Recalculate tax if proportional, or retain line tax
    const totalAmount = Number((netSubtotal + taxTotal).toFixed(2));

    const subNumber = await generateSubscriptionNumber();
    const subStartDate = startDate ? new Date(startDate) : new Date();

    // Default expiry based on frequency if not provided
    let calculatedExpiry = expiryDate ? new Date(expiryDate) : null;
    if (!calculatedExpiry) {
      calculatedExpiry = new Date(subStartDate);
      if (plan.billingFrequency === 'daily') calculatedExpiry.setDate(calculatedExpiry.getDate() + 30);
      else if (plan.billingFrequency === 'weekly') calculatedExpiry.setDate(calculatedExpiry.getDate() + 84); // 12 weeks
      else if (plan.billingFrequency === 'monthly') calculatedExpiry.setMonth(calculatedExpiry.getMonth() + 12);
      else if (plan.billingFrequency === 'yearly') calculatedExpiry.setFullYear(calculatedExpiry.getFullYear() + 1);
    }

    // Initial status:
    // If created by customer via portal: 'Quotation' or 'Draft'
    // If staff creates: 'Draft'
    const initialStatus = 'Draft';

    const subscription = await Subscription.create({
      subscriptionNumber: subNumber,
      customerId: targetCustomerId,
      planId,
      quotationTemplateId: quotationTemplateId || null,
      startDate: subStartDate,
      expiryDate: calculatedExpiry,
      nextBillingDate: subStartDate,
      paymentTerms: paymentTerms || 'Net 30',
      lines: processedLines,
      subtotal: Number(subtotal.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      discountTotal: Number(discountTotal.toFixed(2)),
      totalAmount,
      appliedDiscountId,
      status: initialStatus,
      statusHistory: [{
        status: initialStatus,
        changedAt: new Date(),
        changedBy: req.user.email,
        note: 'Initial subscription creation'
      }],
      notes: notes || ''
    });

    return res.status(201).json({
      success: true,
      message: `Subscription ${subNumber} created in ${initialStatus} state!`,
      subscription
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create subscription', error: err.message });
  }
};

// State transitions: Draft -> Quotation -> Confirmed -> Active -> Closed / Paused
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus, note } = req.body;

    const validStatuses = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const sub = await Subscription.findById(id);
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });

    // Customer permission check: customers can only confirm a quotation or pause/close if allowed
    if (req.user.role === 'customer') {
      if (String(sub.customerId) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      // Customer can confirm a quotation
      if (sub.status === 'Quotation' && newStatus === 'Confirmed') {
        // Allowed
      } else if (newStatus === 'Paused' || newStatus === 'Closed') {
        const plan = await Plan.findById(sub.planId);
        if (newStatus === 'Paused' && (!plan || !plan.allowPause)) {
          return res.status(400).json({ success: false, message: 'Pausing is not permitted for this plan.' });
        }
        if (newStatus === 'Closed' && (!plan || !plan.allowEarlyClose)) {
          return res.status(400).json({ success: false, message: 'Early cancellation is not permitted for this plan.' });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: `Customers cannot perform transition from ${sub.status} to ${newStatus}.`
        });
      }
    }

    // Verify Plan lifecycle rules when pausing or early closing
    const plan = await Plan.findById(sub.planId);
    if (plan) {
      if (newStatus === 'Paused' && !plan.allowPause) {
        return res.status(400).json({ success: false, message: `Plan '${plan.name}' does not allow pausing.` });
      }
      if (newStatus === 'Closed' && !plan.allowEarlyClose) {
        const now = new Date();
        if (sub.expiryDate && new Date(sub.expiryDate) > now) {
          return res.status(400).json({
            success: false,
            message: `Plan '${plan.name}' does not permit early closure before expiry (${new Date(sub.expiryDate).toLocaleDateString()}).`
          });
        }
      }
    }

    const updatedHistory = [
      ...(sub.statusHistory || []),
      {
        status: newStatus,
        changedAt: new Date(),
        changedBy: req.user.email,
        note: note || `Status transitioned to ${newStatus}`
      }
    ];

    const updated = await Subscription.findByIdAndUpdate(id, {
      status: newStatus,
      statusHistory: updatedHistory
    }, { new: true });

    return res.json({
      success: true,
      message: `Subscription ${sub.subscriptionNumber} is now ${newStatus}.`,
      subscription: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update subscription status', error: err.message });
  }
};

// Renew subscription
exports.renew = async (req, res) => {
  try {
    const { id } = req.params;
    const sub = await Subscription.findById(id);
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });

    const plan = await Plan.findById(sub.planId);
    if (plan && !plan.allowRenewal) {
      return res.status(400).json({ success: false, message: `Plan '${plan.name}' does not permit renewals.` });
    }

    const currentExpiry = new Date(sub.expiryDate || new Date());
    const newExpiry = new Date(currentExpiry);

    if (plan?.billingFrequency === 'daily') newExpiry.setDate(newExpiry.getDate() + 30);
    else if (plan?.billingFrequency === 'weekly') newExpiry.setDate(newExpiry.getDate() + 84);
    else if (plan?.billingFrequency === 'yearly') newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    else newExpiry.setMonth(newExpiry.getMonth() + 12);

    const updated = await Subscription.findByIdAndUpdate(id, {
      expiryDate: newExpiry,
      status: 'Active',
      $push: {
        statusHistory: {
          status: 'Active',
          changedAt: new Date(),
          changedBy: req.user.email,
          note: `Renewed subscription until ${newExpiry.toLocaleDateString()}`
        }
      }
    }, { new: true });

    return res.json({
      success: true,
      message: `Subscription ${sub.subscriptionNumber} renewed until ${newExpiry.toLocaleDateString()}!`,
      subscription: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to renew subscription', error: err.message });
  }
};
