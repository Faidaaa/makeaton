const { Payment, Invoice, User } = require('../models');

// Helper to generate readable payment numbers like PAY-2026-0001
const generatePaymentNumber = async () => {
  const count = await Payment.countDocuments();
  const year = new Date().getFullYear();
  return `PAY-${year}-${String(count + 1).padStart(4, '0')}`;
};

exports.recordPayment = async (req, res) => {
  try {
    const { invoiceId, amount, paymentMethod, paymentDate, reference, note } = req.body;

    if (!invoiceId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid invoice ID and positive payment amount are required.' });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: 'Target invoice not found' });

    // Role check: customer can pay their own invoice (e.g. simulated payment gateway / card)
    if (req.user.role === 'customer' && String(invoice.customerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to pay this invoice' });
    }

    const payNumber = await generatePaymentNumber();
    const paidAmount = Number(amount);

    const payment = await Payment.create({
      paymentNumber: payNumber,
      invoiceId,
      customerId: invoice.customerId,
      amount: paidAmount,
      paymentMethod: paymentMethod || 'Bank Transfer',
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      reference: reference || '',
      note: note || '',
      recordedBy: req.user.email
    });

    // Recalculate invoice amounts
    const newAmountPaid = Number(((invoice.amountPaid || 0) + paidAmount).toFixed(2));
    const newAmountDue = Math.max(0, Number((invoice.totalAmount - newAmountPaid).toFixed(2)));
    
    // Automatically transition to Paid if fully settled!
    const newStatus = newAmountDue <= 0 ? 'Paid' : (invoice.status === 'Draft' ? 'Confirmed' : invoice.status);

    const updatedInvoice = await Invoice.findByIdAndUpdate(invoiceId, {
      amountPaid: newAmountPaid,
      amountDue: newAmountDue,
      status: newStatus
    }, { new: true });

    return res.status(201).json({
      success: true,
      message: `Payment of $${paidAmount.toFixed(2)} recorded successfully (${payNumber})! Invoice status is now ${newStatus}.`,
      payment,
      invoice: updatedInvoice
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to record payment', error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'customer') {
      filter.customerId = req.user._id;
    } else if (req.query.customerId) {
      filter.customerId = req.query.customerId;
    }

    const payments = await Payment.find(filter, { createdAt: -1 });

    const invoices = await Invoice.find();
    const users = await User.find();
    const invMap = {};
    const userMap = {};
    invoices.forEach(i => { invMap[String(i._id)] = i.invoiceNumber; });
    users.forEach(u => { userMap[String(u._id)] = { name: u.name, company: u.company }; });

    const enriched = payments.map(p => ({
      ...p,
      invoiceNumber: invMap[String(p.invoiceId)] || 'N/A',
      customer: userMap[String(p.customerId)] || null
    }));

    return res.json({ success: true, count: enriched.length, payments: enriched });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve payments', error: err.message });
  }
};
