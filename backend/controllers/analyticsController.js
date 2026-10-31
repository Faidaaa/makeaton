const { Subscription, Invoice, Payment, Plan, User } = require('../models');

exports.getFinanceSummary = async (req, res) => {
  const startTime = Date.now();
  try {
    const { startDate, endDate, planId, customerId } = req.query;

    const allSubs = await Subscription.find();
    const allInvoices = await Invoice.find();
    const allPayments = await Payment.find();
    const allPlans = await Plan.find();
    const allUsers = await User.find();

    const userMap = {};
    const planMap = {};
    allUsers.forEach(u => { userMap[String(u._id)] = { name: u.name, company: u.company, email: u.email }; });
    allPlans.forEach(p => { planMap[String(p._id)] = p; });

    // 1. Subscription Metrics
    let filteredSubs = allSubs;
    if (customerId) filteredSubs = filteredSubs.filter(s => String(s.customerId) === String(customerId));
    if (planId) filteredSubs = filteredSubs.filter(s => String(s.planId) === String(planId));

    const totalSubscriptions = filteredSubs.length;
    const activeSubscriptions = filteredSubs.filter(s => s.status === 'Active').length;
    const quotationCount = filteredSubs.filter(s => s.status === 'Quotation').length;
    const confirmedCount = filteredSubs.filter(s => s.status === 'Confirmed').length;
    const draftCount = filteredSubs.filter(s => s.status === 'Draft').length;
    const pausedCount = filteredSubs.filter(s => s.status === 'Paused').length;
    const closedCount = filteredSubs.filter(s => s.status === 'Closed').length;

    // Monthly Recurring Revenue (MRR) & Annual Recurring Revenue (ARR) calculation
    let mrr = 0;
    filteredSubs.filter(s => s.status === 'Active').forEach(sub => {
      const plan = planMap[String(sub.planId)];
      const freq = plan ? plan.billingFrequency : 'monthly';
      const amount = Number(sub.totalAmount) || 0;

      if (freq === 'monthly') mrr += amount;
      else if (freq === 'yearly') mrr += amount / 12;
      else if (freq === 'weekly') mrr += (amount * 52) / 12;
      else if (freq === 'daily') mrr += amount * 30;
    });
    const arr = mrr * 12;

    // 2. Invoice & Revenue Metrics
    let filteredInvoices = allInvoices;
    if (customerId) filteredInvoices = filteredInvoices.filter(i => String(i.customerId) === String(customerId));
    if (startDate) filteredInvoices = filteredInvoices.filter(i => new Date(i.issueDate) >= new Date(startDate));
    if (endDate) filteredInvoices = filteredInvoices.filter(i => new Date(i.issueDate) <= new Date(endDate));

    let totalInvoiced = 0;
    let totalCollectedRevenue = 0;
    let totalOwedRevenue = 0;
    const overdueInvoices = [];

    const now = new Date();

    filteredInvoices.forEach(inv => {
      if (inv.status === 'Cancelled') return;
      totalInvoiced += Number(inv.totalAmount) || 0;
      totalCollectedRevenue += Number(inv.amountPaid) || 0;
      totalOwedRevenue += Number(inv.amountDue) || 0;

      const isOverdue = inv.status !== 'Paid' && new Date(inv.dueDate) < now;
      if (isOverdue) {
        const diffDays = Math.ceil((now - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));
        overdueInvoices.push({
          id: inv._id,
          invoiceNumber: inv.invoiceNumber,
          customer: userMap[String(inv.customerId)] || { name: 'Unknown Customer' },
          dueDate: inv.dueDate,
          daysOverdue: diffDays,
          amountDue: inv.amountDue,
          totalAmount: inv.totalAmount,
          status: inv.status
        });
      }
    });

    // Sort overdue invoices by most overdue first
    overdueInvoices.sort((a, b) => b.daysOverdue - a.daysOverdue);

    // 3. Payment summary by method
    const paymentMethodStats = {};
    allPayments.forEach(p => {
      paymentMethodStats[p.paymentMethod] = (paymentMethodStats[p.paymentMethod] || 0) + Number(p.amount);
    });

    const executionTimeMs = Date.now() - startTime;

    return res.json({
      success: true,
      performance: {
        responseTimeMs: executionTimeMs,
        satisfiesUnderTwoSecondsSla: executionTimeMs < 2000
      },
      summary: {
        // Finance Lead 4 Core Inquiries:
        activeSubscriptions,
        totalSubscriptions,
        revenueCameIn: Number(totalCollectedRevenue.toFixed(2)),
        revenueStillOwed: Number(totalOwedRevenue.toFixed(2)),
        overdueInvoiceCount: overdueInvoices.length,
        totalOverdueAmount: Number(overdueInvoices.reduce((sum, i) => sum + i.amountDue, 0).toFixed(2)),
        // MRR & ARR
        mrr: Number(mrr.toFixed(2)),
        arr: Number(arr.toFixed(2)),
        totalInvoiced: Number(totalInvoiced.toFixed(2))
      },
      subscriptionBreakdown: {
        active: activeSubscriptions,
        quotation: quotationCount,
        confirmed: confirmedCount,
        draft: draftCount,
        paused: pausedCount,
        closed: closedCount
      },
      overdueInvoices,
      paymentMethodStats
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Analytics calculation failed', error: err.message });
  }
};
