/**
 * In-Memory Data Store & Seed Data
 * Provides resilient fallback storage with instant zero-configuration testing.
 * Seamlessly interfaces with Mongoose models when MongoDB is connected.
 */

let quotations = [
  {
    _id: 'quo_1',
    quotationNumber: 'QUO-2026-0001',
    customer: { id: 'cust_101', name: 'Acme Technologies Inc.', email: 'billing@acme.com', company: 'Acme Corp' },
    plan: { id: 'plan_growth', name: 'Growth Tier', billingFrequency: 'Monthly', basePrice: 199 },
    startDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    expiryDate: new Date(Date.now() + 25 * 86400000).toISOString(),
    paymentTerms: 'Net 30',
    items: [
      { productId: 'prod_api_seats', name: 'Additional API Seats (Pack of 5)', quantity: 2, unitPrice: 25, taxRate: 10, subtotal: 50, taxAmount: 5, total: 55 },
      { productId: 'prod_priority_support', name: '24/7 Priority SLA Support', quantity: 1, unitPrice: 150, taxRate: 10, subtotal: 150, taxAmount: 15, total: 165 }
    ],
    subtotal: 399,
    taxAmount: 39.9,
    totalAmount: 438.9,
    status: 'Sent',
    isTemplate: false,
    notes: 'Includes expedited onboarding SLA'
  },
  {
    _id: 'quo_2',
    quotationNumber: 'QUO-2026-0002',
    customer: { id: 'cust_102', name: 'Nexus Digital Agency', email: 'accounts@nexusdigital.io', company: 'Nexus Digital' },
    plan: { id: 'plan_enterprise', name: 'Enterprise Elite', billingFrequency: 'Annual', basePrice: 1200 },
    startDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    paymentTerms: 'Due on Receipt',
    items: [
      { productId: 'prod_storage_tb', name: 'Dedicated Cloud Storage (1 TB)', quantity: 3, unitPrice: 80, taxRate: 10, subtotal: 240, taxAmount: 24, total: 264 },
      { productId: 'prod_audit_logs', name: 'Advanced Compliance Audit Logs', quantity: 1, unitPrice: 120, taxRate: 10, subtotal: 120, taxAmount: 12, total: 132 }
    ],
    subtotal: 1560,
    taxAmount: 156,
    totalAmount: 1716,
    status: 'Draft',
    isTemplate: false,
    notes: 'Annual upfront payment discount pre-applied'
  },
  {
    _id: 'quo_template_1',
    quotationNumber: 'TPL-SaaS-STD',
    customer: { id: 'cust_generic', name: 'Standard SaaS Template', email: 'templates@brightloop.io', company: 'Brightloop Standard' },
    plan: { id: 'plan_growth', name: 'Growth Tier', billingFrequency: 'Monthly', basePrice: 199 },
    startDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 60 * 86400000).toISOString(),
    paymentTerms: 'Net 30',
    items: [
      { productId: 'prod_api_seats', name: 'Additional API Seats (Pack of 5)', quantity: 1, unitPrice: 25, taxRate: 10, subtotal: 25, taxAmount: 2.5, total: 27.5 },
      { productId: 'prod_storage_tb', name: 'Dedicated Cloud Storage (1 TB)', quantity: 1, unitPrice: 80, taxRate: 10, subtotal: 80, taxAmount: 8, total: 88 }
    ],
    subtotal: 304,
    taxAmount: 30.4,
    totalAmount: 334.4,
    status: 'Draft',
    isTemplate: true,
    templateName: 'Standard Growth + Storage Bundle',
    notes: 'Default fast-track quote template for mid-market clients'
  }
];

let subscriptions = [
  {
    _id: 'sub_1',
    subscriptionNumber: 'SUB-2026-0001',
    quotationNumber: 'QUO-2026-0001',
    customer: { id: 'cust_101', name: 'Acme Technologies Inc.', email: 'billing@acme.com', company: 'Acme Corp' },
    plan: { id: 'plan_growth', name: 'Growth Tier', billingFrequency: 'Monthly', basePrice: 199 },
    items: [
      { productId: 'prod_api_seats', name: 'Additional API Seats (Pack of 5)', quantity: 2, unitPrice: 25, taxRate: 10, subtotal: 50, taxAmount: 5, total: 55 }
    ],
    subtotal: 249,
    taxAmount: 24.9,
    totalAmount: 273.9,
    status: 'Active',
    startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    expiryDate: new Date(Date.now() + 335 * 86400000).toISOString(),
    renewalDate: new Date(Date.now() + 335 * 86400000).toISOString(),
    isPaused: false,
    history: [
      { fromStatus: null, toStatus: 'Draft', timestamp: new Date(Date.now() - 35 * 86400000).toISOString(), changedBy: 'Staff Member', note: 'Created subscription' },
      { fromStatus: 'Draft', toStatus: 'Quotation', timestamp: new Date(Date.now() - 33 * 86400000).toISOString(), changedBy: 'Staff Member', note: 'Quote delivered to Acme' },
      { fromStatus: 'Quotation', toStatus: 'Confirmed', timestamp: new Date(Date.now() - 31 * 86400000).toISOString(), changedBy: 'Staff Member', note: 'Signed agreement received' },
      { fromStatus: 'Confirmed', toStatus: 'Active', timestamp: new Date(Date.now() - 30 * 86400000).toISOString(), changedBy: 'Staff Member', note: 'Service provisioned' }
    ]
  },
  {
    _id: 'sub_2',
    subscriptionNumber: 'SUB-2026-0002',
    quotationNumber: 'QUO-2026-0003',
    customer: { id: 'cust_103', name: 'Solaris Cloud Labs', email: 'finance@solaris.dev', company: 'Solaris Labs' },
    plan: { id: 'plan_starter', name: 'Starter Tier', billingFrequency: 'Monthly', basePrice: 49 },
    items: [],
    subtotal: 49,
    taxAmount: 4.9,
    totalAmount: 53.9,
    status: 'Confirmed',
    startDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    isPaused: false,
    history: [
      { fromStatus: null, toStatus: 'Draft', timestamp: new Date(Date.now() - 4 * 86400000).toISOString(), changedBy: 'Staff Member', note: 'Initial draft' },
      { fromStatus: 'Draft', toStatus: 'Quotation', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), changedBy: 'Staff Member', note: 'Proposal shared' },
      { fromStatus: 'Quotation', toStatus: 'Confirmed', timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), changedBy: 'Staff Member', note: 'Client accepted proposal' }
    ]
  },
  {
    _id: 'sub_3',
    subscriptionNumber: 'SUB-2026-0003',
    quotationNumber: null,
    customer: { id: 'cust_104', name: 'Vertex Financial Group', email: 'ops@vertexfin.com', company: 'Vertex Group' },
    plan: { id: 'plan_enterprise', name: 'Enterprise Elite', billingFrequency: 'Annual', basePrice: 1200 },
    items: [
      { productId: 'prod_audit_logs', name: 'Advanced Compliance Audit Logs', quantity: 2, unitPrice: 120, taxRate: 10, subtotal: 240, taxAmount: 24, total: 264 }
    ],
    subtotal: 1440,
    taxAmount: 144,
    totalAmount: 1584,
    status: 'Quotation',
    startDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    isPaused: false,
    history: [
      { fromStatus: null, toStatus: 'Draft', timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), changedBy: 'Staff Member', note: 'Draft initialized' },
      { fromStatus: 'Draft', toStatus: 'Quotation', timestamp: new Date().toISOString(), changedBy: 'Staff Member', note: 'Converted to formal quotation' }
    ]
  }
];

export const memoryStore = {
  // Quotations
  getQuotations({ search, status } = {}) {
    let result = quotations.filter((q) => !q.isTemplate);
    if (status && status !== 'All' && status !== 'undefined' && status !== 'null' && status.trim() !== '') {
      result = result.filter((q) => q.status.toLowerCase() === status.toLowerCase());
    }
    if (search && search.trim() && search !== 'undefined' && search !== 'null') {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.quotationNumber.toLowerCase().includes(q) ||
          item.customer.name.toLowerCase().includes(q) ||
          item.plan.name.toLowerCase().includes(q)
      );
    }
    return result;
  },

  getTemplates() {
    return quotations.filter((q) => q.isTemplate);
  },

  getQuotationById(id) {
    return quotations.find((q) => q._id === id || q.quotationNumber === id);
  },

  createQuotation(data) {
    const id = 'quo_' + Date.now();
    const quotationNumber = data.isTemplate
      ? `TPL-${Date.now().toString().slice(-4)}`
      : `QUO-2026-${String(quotations.length + 1).padStart(4, '0')}`;
    
    const newQuotation = {
      _id: id,
      quotationNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    quotations.unshift(newQuotation);
    return newQuotation;
  },

  updateQuotation(id, updateData) {
    const index = quotations.findIndex((q) => q._id === id || q.quotationNumber === id);
    if (index === -1) return null;
    quotations[index] = {
      ...quotations[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    return quotations[index];
  },

  // Subscriptions
  getSubscriptions({ search, status } = {}) {
    let result = [...subscriptions];
    if (status && status !== 'All' && status !== 'undefined' && status !== 'null' && status.trim() !== '') {
      result = result.filter((s) => s.status.toLowerCase() === status.toLowerCase());
    }
    if (search && search.trim() && search !== 'undefined' && search !== 'null') {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.subscriptionNumber.toLowerCase().includes(q) ||
          s.customer.name.toLowerCase().includes(q) ||
          s.plan.name.toLowerCase().includes(q)
      );
    }
    return result;
  },

  getSubscriptionById(id) {
    return subscriptions.find((s) => s._id === id || s.subscriptionNumber === id);
  },

  createSubscription(data) {
    const id = 'sub_' + Date.now();
    const subscriptionNumber = `SUB-2026-${String(subscriptions.length + 1).padStart(4, '0')}`;
    const newSubscription = {
      _id: id,
      subscriptionNumber,
      status: data.status || 'Draft',
      isPaused: false,
      history: [
        {
          fromStatus: null,
          toStatus: data.status || 'Draft',
          timestamp: new Date().toISOString(),
          changedBy: data.changedBy || 'Staff Member',
          note: data.note || 'Subscription record created'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    subscriptions.unshift(newSubscription);
    return newSubscription;
  },

  updateSubscriptionStatus(id, nextStatus, note = '', changedBy = 'Staff Member') {
    const sub = this.getSubscriptionById(id);
    if (!sub) return null;

    const previousStatus = sub.status;
    sub.status = nextStatus;
    sub.history.push({
      fromStatus: previousStatus,
      toStatus: nextStatus,
      timestamp: new Date().toISOString(),
      changedBy,
      note: note || `Transitioned status from ${previousStatus} to ${nextStatus}`
    });
    sub.updatedAt = new Date().toISOString();
    return sub;
  },

  togglePauseSubscription(id) {
    const sub = this.getSubscriptionById(id);
    if (!sub) return null;
    sub.isPaused = !sub.isPaused;
    sub.pausedAt = sub.isPaused ? new Date().toISOString() : null;
    sub.history.push({
      fromStatus: sub.status,
      toStatus: sub.status,
      timestamp: new Date().toISOString(),
      changedBy: 'Staff Member',
      note: sub.isPaused ? 'Subscription manually paused by staff' : 'Subscription resumed by staff'
    });
    return sub;
  },

  renewSubscription(id, additionalMonths = 12) {
    const sub = this.getSubscriptionById(id);
    if (!sub) return null;
    const currentExpiry = new Date(sub.expiryDate || Date.now());
    currentExpiry.setMonth(currentExpiry.getMonth() + additionalMonths);
    sub.expiryDate = currentExpiry.toISOString();
    sub.renewalDate = currentExpiry.toISOString();
    sub.history.push({
      fromStatus: sub.status,
      toStatus: sub.status,
      timestamp: new Date().toISOString(),
      changedBy: 'Staff Member',
      note: `Renewed subscription term for +${additionalMonths} months`
    });
    return sub;
  },

  // Staff Overview Aggregations
  getStaffMetrics() {
    const totalQuotes = quotations.filter((q) => !q.isTemplate).length;
    const pendingQuotes = quotations.filter((q) => q.status === 'Sent' || q.status === 'Draft').length;
    const activeSubs = subscriptions.filter((s) => s.status === 'Active').length;
    const totalSubs = subscriptions.length;
    const pausedSubs = subscriptions.filter((s) => s.isPaused).length;

    // Calculate total active ARR / MRR value
    const activeRevenue = subscriptions
      .filter((s) => s.status === 'Active')
      .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

    return {
      activeSubscriptions: activeSubs,
      totalSubscriptions: totalSubs,
      pausedSubscriptions: pausedSubs,
      pendingQuotations: pendingQuotes,
      totalQuotations: totalQuotes,
      estimatedRevenue: Math.round(activeRevenue * 100) / 100,
      recentQuotations: quotations.filter((q) => !q.isTemplate).slice(0, 5),
      recentSubscriptions: subscriptions.slice(0, 5)
    };
  }
};
