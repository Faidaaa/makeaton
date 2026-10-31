const { Invoice, Subscription, User, Plan, Discount, TaxRule, Payment } = require('../models');

// Helper to generate invoice numbers like INV-2026-0001
const generateInvoiceNumber = async () => {
  const count = await Invoice.countDocuments();
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
};

// Batch billing day runner
exports.runBillingDay = async (req, res) => {
  try {
    const today = new Date();
    // Find all active subscriptions
    const activeSubs = await Subscription.find({ status: 'Active' });
    const generatedInvoices = [];
    const skippedAlreadyBilled = [];

    // Fetch tax rules for default fallback
    const defaultTax = await TaxRule.findOne({ isDefault: true }) || { rate: 18 };

    for (const sub of activeSubs) {
      // Calculate start and end of billing period based on plan
      const plan = await Plan.findById(sub.planId);
      const freq = plan ? plan.billingFrequency : 'monthly';

      let periodStart = sub.lastBilledDate ? new Date(sub.lastBilledDate) : new Date(sub.startDate);
      let periodEnd = new Date(periodStart);

      if (freq === 'daily') periodEnd.setDate(periodEnd.getDate() + 1);
      else if (freq === 'weekly') periodEnd.setDate(periodEnd.getDate() + 7);
      else if (freq === 'yearly') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);

      // IDEMPOTENCY CHECK: "Nothing should be billed twice or skipped"
      // Check if invoice already exists for this subscription covering this billing period
      const existingInvoice = await Invoice.findOne({
        subscriptionId: sub._id,
        'billingPeriod.start': { $gte: new Date(periodStart.toDateString()) },
        status: { $ne: 'Cancelled' }
      });

      if (existingInvoice) {
        skippedAlreadyBilled.push({
          subscriptionNumber: sub.subscriptionNumber,
          reason: `Already invoiced on ${new Date(existingInvoice.issueDate).toLocaleDateString()} (${existingInvoice.invoiceNumber})`
        });
        continue;
      }

      // Check auto-close rule if plan ended
      if (plan && plan.autoCloseAtEnd && plan.endDate && new Date(plan.endDate) <= today) {
        await Subscription.findByIdAndUpdate(sub._id, {
          status: 'Closed',
          $push: {
            statusHistory: {
              status: 'Closed',
              changedAt: new Date(),
              changedBy: 'Billing Automation',
              note: 'Auto-closed at end of plan period as configured in plan rules.'
            }
          }
        });
        continue;
      }

      // Check discount auto-application rule:
      // "Once it applies, it should appear on the next invoice on its own, without anyone having to remember it, and stop when it expires or runs out."
      let appliedDiscount = null;
      let totalDiscountAmount = 0;

      if (sub.appliedDiscountId) {
        const discount = await Discount.findById(sub.appliedDiscountId);
        if (discount && discount.isActive) {
          let valid = true;
          if (discount.usageLimit > 0 && discount.usageCount >= discount.usageLimit) valid = false;
          if (discount.endDate && new Date(discount.endDate) < today) valid = false;

          if (valid) {
            appliedDiscount = discount;
            if (discount.type === 'percentage') {
              totalDiscountAmount = (sub.subtotal * discount.value) / 100;
            } else {
              totalDiscountAmount = Math.min(sub.subtotal, discount.value);
            }
            // Increment usage
            await Discount.findByIdAndUpdate(discount._id, { $inc: { usageCount: 1 } });
          }
        }
      }

      // Build invoice lines from subscription lines
      const invoiceLines = sub.lines.map(line => {
        const lineTotal = line.quantity * line.unitPrice;
        const lineTax = (lineTotal * (line.taxRate || defaultTax.rate)) / 100;
        let lineDiscount = 0;

        if (appliedDiscount && appliedDiscount.appliesTo === 'whole_subscription' && sub.subtotal > 0) {
          lineDiscount = (lineTotal / sub.subtotal) * totalDiscountAmount;
        }

        return {
          description: `${line.productName} (${line.variant || 'Standard'}) - ${line.quantity} unit(s)`,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxRate: line.taxRate || defaultTax.rate,
          taxAmount: Number(lineTax.toFixed(2)),
          discountAmount: Number(lineDiscount.toFixed(2)),
          total: Number((lineTotal + lineTax - lineDiscount).toFixed(2))
        };
      });

      const netSubtotal = Math.max(0, sub.subtotal - totalDiscountAmount);
      const taxAmount = Number(sub.taxTotal.toFixed(2));
      const totalAmount = Number((netSubtotal + taxAmount).toFixed(2));

      // Calculate due date based on payment terms
      const dueDate = new Date(today);
      if (sub.paymentTerms === 'Net 15') dueDate.setDate(dueDate.getDate() + 15);
      else if (sub.paymentTerms === 'Net 30') dueDate.setDate(dueDate.getDate() + 30);
      else if (sub.paymentTerms === 'Net 60') dueDate.setDate(dueDate.getDate() + 60);
      else dueDate.setDate(dueDate.getDate() + 1); // Immediate

      const invNumber = await generateInvoiceNumber();

      const newInvoice = await Invoice.create({
        invoiceNumber: invNumber,
        subscriptionId: sub._id,
        customerId: sub.customerId,
        issueDate: today,
        dueDate,
        billingPeriod: {
          start: periodStart,
          end: periodEnd
        },
        lines: invoiceLines,
        subtotal: sub.subtotal,
        taxAmount,
        discountAmount: Number(totalDiscountAmount.toFixed(2)),
        totalAmount,
        amountPaid: 0,
        amountDue: totalAmount,
        status: 'Draft',
        notes: `Automated Billing Day Invoice for Subscription ${sub.subscriptionNumber}.`
      });

      // Update next billing cycle
      let nextCycle = new Date(periodEnd);
      await Subscription.findByIdAndUpdate(sub._id, {
        lastBilledDate: today,
        nextBillingDate: nextCycle
      });

      generatedInvoices.push(newInvoice);
    }

    return res.json({
      success: true,
      message: `Billing Day completed! ${generatedInvoices.length} invoice(s) generated. ${skippedAlreadyBilled.length} subscription(s) skipped (already billed).`,
      generatedCount: generatedInvoices.length,
      skippedCount: skippedAlreadyBilled.length,
      generatedInvoices,
      skippedDetails: skippedAlreadyBilled
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Billing Day processing failed', error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    let filter = {};

    // Customer role can ONLY see their own invoices
    if (req.user.role === 'customer') {
      filter.customerId = req.user._id;
    } else {
      if (req.query.customerId) filter.customerId = req.query.customerId;
      if (req.query.status) filter.status = req.query.status;
      if (req.query.subscriptionId) filter.subscriptionId = req.query.subscriptionId;
      if (req.query.overdue === 'true') {
        filter.status = { $ne: 'Paid' };
        filter.dueDate = { $lt: new Date() };
      }
    }

    const invoices = await Invoice.find(filter, { createdAt: -1 });

    const users = await User.find();
    const subs = await Subscription.find();
    const userMap = {};
    const subMap = {};
    users.forEach(u => { userMap[String(u._id)] = { id: u._id, name: u.name, email: u.email, company: u.company }; });
    subs.forEach(s => { subMap[String(s._id)] = { id: s._id, subscriptionNumber: s.subscriptionNumber }; });

    const enriched = invoices.map(inv => {
      const isOverdue = inv.status !== 'Paid' && inv.status !== 'Cancelled' && new Date(inv.dueDate) < new Date();
      return {
        ...inv,
        customer: userMap[String(inv.customerId)] || null,
        subscription: subMap[String(inv.subscriptionId)] || null,
        isOverdue
      };
    });

    return res.json({ success: true, count: enriched.length, invoices: enriched });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve invoices', error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const inv = await Invoice.findById(req.params.id);
    if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (req.user.role === 'customer' && String(inv.customerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied to this invoice' });
    }

    const customer = await User.findById(inv.customerId);
    const subscription = inv.subscriptionId ? await Subscription.findById(inv.subscriptionId) : null;
    const payments = await Payment.find({ invoiceId: inv._id });

    return res.json({
      success: true,
      invoice: {
        ...inv,
        customer: customer ? { id: customer._id, name: customer.name, email: customer.email, company: customer.company, phone: customer.phone } : null,
        subscription: subscription ? { id: subscription._id, subscriptionNumber: subscription.subscriptionNumber } : null,
        payments
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch invoice', error: err.message });
  }
};

// Invoice status progression: Draft -> Confirmed -> Paid (or Cancelled)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['Draft', 'Confirmed', 'Paid', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const inv = await Invoice.findById(id);
    if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const updated = await Invoice.findByIdAndUpdate(id, {
      status,
      notes: note ? `${inv.notes || ''}\n[${new Date().toLocaleDateString()}] ${note}` : inv.notes
    }, { new: true });

    return res.json({
      success: true,
      message: `Invoice ${inv.invoiceNumber} status updated to ${status}.`,
      invoice: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update invoice status', error: err.message });
  }
};

// Send or simulate sending email
exports.sendInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const inv = await Invoice.findById(id);
    if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const customer = await User.findById(inv.customerId);
    const targetEmail = customer ? customer.email : 'Customer Email';

    const updated = await Invoice.findByIdAndUpdate(id, {
      sentAt: new Date(),
      status: inv.status === 'Draft' ? 'Confirmed' : inv.status
    }, { new: true });

    return res.json({
      success: true,
      message: `Invoice ${inv.invoiceNumber} successfully dispatched to ${targetEmail}!`,
      invoice: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to send invoice', error: err.message });
  }
};
