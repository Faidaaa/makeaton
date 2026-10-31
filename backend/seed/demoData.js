const bcrypt = require('bcryptjs');
const {
  User,
  Product,
  Plan,
  QuotationTemplate,
  Subscription,
  Discount,
  TaxRule,
  Invoice,
  Payment
} = require('../models');

async function seedDatabase() {
  console.log('[Seed] Checking and seeding demo data for Brightloop Software...');

  // Check if users already exist
  const existingCount = await User.countDocuments();
  if (existingCount > 0) {
    console.log('[Seed] Database already contains records. Skipping initial seeding.');
    return;
  }

  // 1. Users
  const passwordHash = await bcrypt.hash('BrightAdmin!2026', 10);
  const staffHash = await bcrypt.hash('BrightStaff!2026', 10);
  const customerHash = await bcrypt.hash('Customer!2026', 10);

  const admin = await User.create({
    name: 'Eleanor Vance (Admin)',
    email: 'admin@brightloop.com',
    password: passwordHash,
    role: 'admin',
    company: 'Brightloop Software Headquarters',
    phone: '+1 (555) 019-2831'
  });

  const staff = await User.create({
    name: 'Marcus Reynolds (Sales Rep)',
    email: 'marcus.sales@brightloop.com',
    password: staffHash,
    role: 'staff',
    company: 'Brightloop Software Sales Team',
    phone: '+1 (555) 019-4421'
  });

  const customer1 = await User.create({
    name: 'Oliver Queen',
    email: 'oliver@queenenterprises.com',
    password: customerHash,
    role: 'customer',
    company: 'Queen Enterprises LLC',
    phone: '+1 (555) 304-9988'
  });

  const customer2 = await User.create({
    name: 'Elena Rostova',
    email: 'elena@novatech.io',
    password: customerHash,
    role: 'customer',
    company: 'NovaTech Solutions',
    phone: '+1 (555) 872-3312'
  });

  const customer3 = await User.create({
    name: 'David Miller',
    email: 'david@millercafe.com',
    password: customerHash,
    role: 'customer',
    company: 'Miller Artisan Bakery',
    phone: '+1 (555) 441-8890'
  });

  // 2. Tax Rules
  const vatTax = await TaxRule.create({
    name: 'Standard VAT',
    rate: 18,
    country: 'EU / Global',
    isDefault: true,
    description: '18% Standard Value Added Tax'
  });

  const usTax = await TaxRule.create({
    name: 'State Sales Tax',
    rate: 8.5,
    country: 'United States',
    isDefault: false,
    description: '8.5% Standard US Sales Tax'
  });

  const zeroTax = await TaxRule.create({
    name: 'Zero-Rated / Export',
    rate: 0,
    country: 'International',
    isDefault: false,
    description: '0% tax for non-taxable entities'
  });

  // 3. Products with Variants
  const crmProduct = await Product.create({
    name: 'Brightloop Core CRM',
    type: 'Software',
    salesPrice: 450,
    costPrice: 90,
    notes: 'Flagship customer relationship platform with contact management and pipelines.',
    brandVariants: [
      { brandName: 'Standard Edition', surcharge: 0 },
      { brandName: 'Brand: Odoo Integration Edition', surcharge: 560 },
      { brandName: 'Enterprise Edition', surcharge: 350 }
    ],
    variants: [
      { name: 'Standard Edition', priceAdjustment: 0, costAdjustment: 0, sku: 'BL-CRM-STD' },
      { name: 'Brand: Odoo Integration Edition', priceAdjustment: 560, costAdjustment: 80, sku: 'BL-CRM-ODOO' },
      { name: 'Enterprise Edition', priceAdjustment: 350, costAdjustment: 50, sku: 'BL-CRM-ENT' }
    ]
  });

  const erpProduct = await Product.create({
    name: 'Brightloop ERP Operations',
    type: 'Software',
    salesPrice: 850,
    costPrice: 180,
    notes: 'Inventory, procurement, accounting and warehouse synchronization.',
    brandVariants: [
      { brandName: 'Standard Edition', surcharge: 0 },
      { brandName: 'Brand: Odoo Sync Connector', surcharge: 560 }
    ],
    variants: [
      { name: 'Standard Edition', priceAdjustment: 0, costAdjustment: 0, sku: 'BL-ERP-STD' },
      { name: 'Brand: Odoo Sync Connector', priceAdjustment: 560, costAdjustment: 90, sku: 'BL-ERP-ODOO' }
    ]
  });

  const aiBotProduct = await Product.create({
    name: 'AI Support Copilot Add-on',
    type: 'Add-on',
    salesPrice: 180,
    costPrice: 35,
    notes: '24/7 automated customer query triage using conversational AI.',
    brandVariants: [
      { brandName: 'Default 10k Interactions', surcharge: 0 },
      { brandName: 'Unlimited Interactions', surcharge: 220 }
    ],
    variants: [
      { name: 'Default 10k Interactions', priceAdjustment: 0, costAdjustment: 0, sku: 'BL-AI-10K' },
      { name: 'Unlimited Interactions', priceAdjustment: 220, costAdjustment: 50, sku: 'BL-AI-UNL' }
    ]
  });

  const dedicatedSupport = await Product.create({
    name: 'Dedicated 24/7 TAM Support',
    type: 'Service',
    salesPrice: 600,
    costPrice: 150,
    notes: 'Named Technical Account Manager with 15-minute response SLA.',
    brandVariants: [
      { brandName: 'Standard TAM', surcharge: 0 }
    ],
    variants: [
      { name: 'Standard TAM', priceAdjustment: 0, costAdjustment: 0, sku: 'BL-SRV-TAM' }
    ]
  });

  // 4. Plans
  const monthlyStarterPlan = await Plan.create({
    name: 'Monthly Professional Plan',
    productId: crmProduct._id,
    billingFrequency: 'monthly',
    cost: 450,
    minQuantity: 1,
    startDate: new Date('2026-01-01'),
    endDate: null,
    autoCloseAtEnd: false,
    allowEarlyClose: true,
    allowPause: true,
    allowRenewal: true
  });

  const yearlyEnterprisePlan = await Plan.create({
    name: 'Enterprise Annual Contract',
    productId: erpProduct._id,
    billingFrequency: 'yearly',
    cost: 8500,
    minQuantity: 5,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2027-12-31'),
    autoCloseAtEnd: false,
    allowEarlyClose: false,
    allowPause: false,
    allowRenewal: true
  });

  const weeklySprintPlan = await Plan.create({
    name: 'Weekly Growth Sprint Plan',
    productId: crmProduct._id,
    billingFrequency: 'weekly',
    cost: 130,
    minQuantity: 1,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    autoCloseAtEnd: true,
    allowEarlyClose: true,
    allowPause: true,
    allowRenewal: true
  });

  // 5. Discount Rules
  const volumeDiscount = await Discount.create({
    code: 'VOLUME20',
    name: 'High Seat Volume Discount',
    type: 'percentage',
    value: 20,
    minQuantity: 5,
    minPurchaseAmount: 1000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: 100,
    usageCount: 4,
    appliesTo: 'whole_subscription',
    isActive: true
  });

  const enterpriseCredit = await Discount.create({
    code: 'WELCOME500',
    name: 'New Enterprise Fixed Credit',
    type: 'fixed',
    value: 500,
    minQuantity: 1,
    minPurchaseAmount: 3000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: 25,
    usageCount: 2,
    appliesTo: 'whole_subscription',
    isActive: true
  });

  // 6. Quotation Template
  const standardTemplate = await QuotationTemplate.create({
    name: 'Standard SaaS + AI Bundle',
    planId: monthlyStarterPlan._id,
    validityDays: 30,
    paymentTerms: 'Net 30',
    lines: [
      {
        productId: crmProduct._id,
        productName: crmProduct.name,
        variantName: 'Brand: Odoo Integration Edition',
        quantity: 3,
        unitPrice: 1010, // 450 + 560
        taxRate: 18
      },
      {
        productId: aiBotProduct._id,
        productName: aiBotProduct.name,
        variantName: 'Default 10k Interactions',
        quantity: 1,
        unitPrice: 180,
        taxRate: 18
      }
    ],
    notes: 'Quotation automatically calculated with 18% Standard VAT and Odoo brand variant price adjustments.'
  });

  // 7. Subscriptions
  // Subscription 1: Active
  const sub1 = await Subscription.create({
    subscriptionNumber: 'SUB-2026-0001',
    customerId: customer1._id,
    planId: monthlyStarterPlan._id,
    quotationTemplateId: standardTemplate._id,
    startDate: new Date('2026-09-01'),
    expiryDate: new Date('2027-09-01'),
    nextBillingDate: new Date('2026-11-01'),
    paymentTerms: 'Net 30',
    lines: [
      {
        productId: crmProduct._id,
        productName: crmProduct.name,
        variant: 'Brand: Odoo Integration Edition',
        quantity: 5,
        unitPrice: 1010,
        taxRate: 18,
        taxAmount: 909,
        amount: 5050
      },
      {
        productId: aiBotProduct._id,
        productName: aiBotProduct.name,
        variant: 'Default 10k Interactions',
        quantity: 2,
        unitPrice: 180,
        taxRate: 18,
        taxAmount: 64.8,
        amount: 360
      }
    ],
    subtotal: 5410,
    discountTotal: 1082, // 20% volume discount
    taxTotal: 779.04,
    totalAmount: 5107.04,
    appliedDiscountId: volumeDiscount._id,
    status: 'Active',
    lastBilledDate: new Date('2026-10-01'),
    statusHistory: [
      { status: 'Draft', changedAt: new Date('2026-08-25'), changedBy: 'marcus.sales@brightloop.com', note: 'Created quote' },
      { status: 'Quotation', changedAt: new Date('2026-08-26'), changedBy: 'marcus.sales@brightloop.com', note: 'Sent offer to customer' },
      { status: 'Confirmed', changedAt: new Date('2026-08-30'), changedBy: 'oliver@queenenterprises.com', note: 'Customer signed' },
      { status: 'Active', changedAt: new Date('2026-09-01'), changedBy: 'admin@brightloop.com', note: 'Activated for billing' }
    ]
  });

  // Subscription 2: Active (Enterprise)
  const sub2 = await Subscription.create({
    subscriptionNumber: 'SUB-2026-0002',
    customerId: customer2._id,
    planId: yearlyEnterprisePlan._id,
    startDate: new Date('2026-08-15'),
    expiryDate: new Date('2027-08-15'),
    nextBillingDate: new Date('2026-11-15'),
    paymentTerms: 'Net 15',
    lines: [
      {
        productId: erpProduct._id,
        productName: erpProduct.name,
        variant: 'Standard Edition',
        quantity: 8,
        unitPrice: 850,
        taxRate: 18,
        taxAmount: 1224,
        amount: 6800
      },
      {
        productId: dedicatedSupport._id,
        productName: dedicatedSupport.name,
        variant: 'Standard TAM',
        quantity: 1,
        unitPrice: 600,
        taxRate: 18,
        taxAmount: 108,
        amount: 600
      }
    ],
    subtotal: 7400,
    discountTotal: 500, // Fixed $500 discount
    taxTotal: 1242,
    totalAmount: 8142,
    appliedDiscountId: enterpriseCredit._id,
    status: 'Active',
    lastBilledDate: new Date('2026-08-15'),
    statusHistory: [
      { status: 'Draft', changedAt: new Date('2026-08-10'), changedBy: 'marcus.sales@brightloop.com', note: 'Drafted enterprise quote' },
      { status: 'Confirmed', changedAt: new Date('2026-08-14'), changedBy: 'marcus.sales@brightloop.com', note: 'PO confirmed' },
      { status: 'Active', changedAt: new Date('2026-08-15'), changedBy: 'admin@brightloop.com', note: 'Activated' }
    ]
  });

  // Subscription 3: Quotation stage
  const sub3 = await Subscription.create({
    subscriptionNumber: 'SUB-2026-0003',
    customerId: customer3._id,
    planId: weeklySprintPlan._id,
    startDate: new Date('2026-11-01'),
    expiryDate: new Date('2026-12-01'),
    nextBillingDate: new Date('2026-11-01'),
    paymentTerms: 'Immediate',
    lines: [
      {
        productId: crmProduct._id,
        productName: crmProduct.name,
        variant: 'Standard Edition',
        quantity: 2,
        unitPrice: 450,
        taxRate: 18,
        taxAmount: 162,
        amount: 900
      }
    ],
    subtotal: 900,
    discountTotal: 0,
    taxTotal: 162,
    totalAmount: 1062,
    status: 'Quotation',
    statusHistory: [
      { status: 'Draft', changedAt: new Date('2026-10-25'), changedBy: 'marcus.sales@brightloop.com', note: 'Initial proposal' },
      { status: 'Quotation', changedAt: new Date('2026-10-28'), changedBy: 'marcus.sales@brightloop.com', note: 'Sent quotation link' }
    ]
  });

  // 8. Invoices
  // Invoice 1: Paid invoice
  const inv1 = await Invoice.create({
    invoiceNumber: 'INV-2026-0001',
    subscriptionId: sub1._id,
    customerId: customer1._id,
    issueDate: new Date('2026-09-01'),
    dueDate: new Date('2026-10-01'),
    billingPeriod: {
      start: new Date('2026-09-01'),
      end: new Date('2026-09-30')
    },
    lines: [
      {
        description: 'Brightloop Core CRM (Brand: Odoo Integration Edition) - 5 seats',
        quantity: 5,
        unitPrice: 1010,
        taxRate: 18,
        taxAmount: 909,
        discountAmount: 1010,
        total: 4949
      },
      {
        description: 'AI Support Copilot Add-on - 2 units',
        quantity: 2,
        unitPrice: 180,
        taxRate: 18,
        taxAmount: 64.8,
        discountAmount: 72,
        total: 352.8
      }
    ],
    subtotal: 5410,
    taxAmount: 779.04,
    discountAmount: 1082,
    totalAmount: 5107.04,
    amountPaid: 5107.04,
    amountDue: 0,
    status: 'Paid',
    sentAt: new Date('2026-09-01'),
    notes: 'Billed on billing day cycle September 2026.'
  });

  // Payment 1 for Invoice 1
  await Payment.create({
    paymentNumber: 'PAY-2026-0001',
    invoiceId: inv1._id,
    customerId: customer1._id,
    amount: 5107.04,
    paymentMethod: 'Bank Transfer',
    paymentDate: new Date('2026-09-12'),
    reference: 'WIRE-QUEEN-9021',
    note: 'Automated bank clearing received.',
    recordedBy: 'admin@brightloop.com'
  });

  // Invoice 2: Overdue invoice (finance lead will see this in overdue chase list!)
  const inv2 = await Invoice.create({
    invoiceNumber: 'INV-2026-0002',
    subscriptionId: sub2._id,
    customerId: customer2._id,
    issueDate: new Date('2026-09-15'),
    dueDate: new Date('2026-09-30'), // Overdue!
    billingPeriod: {
      start: new Date('2026-09-15'),
      end: new Date('2026-10-14')
    },
    lines: [
      {
        description: 'Brightloop ERP Operations (Standard Edition) - 8 seats',
        quantity: 8,
        unitPrice: 850,
        taxRate: 18,
        taxAmount: 1224,
        discountAmount: 500,
        total: 7524
      },
      {
        description: 'Dedicated 24/7 TAM Support',
        quantity: 1,
        unitPrice: 600,
        taxRate: 18,
        taxAmount: 108,
        discountAmount: 0,
        total: 708
      }
    ],
    subtotal: 7400,
    taxAmount: 1242,
    discountAmount: 500,
    totalAmount: 8142,
    amountPaid: 2000,
    amountDue: 6142,
    status: 'Confirmed',
    sentAt: new Date('2026-09-15'),
    notes: 'Partial payment of $2000 received. Balance of $6142 is overdue.'
  });

  // Partial payment for Invoice 2
  await Payment.create({
    paymentNumber: 'PAY-2026-0002',
    invoiceId: inv2._id,
    customerId: customer2._id,
    amount: 2000,
    paymentMethod: 'Credit Card',
    paymentDate: new Date('2026-09-20'),
    reference: 'CC-CHASE-7712',
    note: 'Initial deposit by client.',
    recordedBy: 'marcus.sales@brightloop.com'
  });

  // Invoice 3: Due in Current Month
  const inv3 = await Invoice.create({
    invoiceNumber: 'INV-2026-0003',
    subscriptionId: sub1._id,
    customerId: customer1._id,
    issueDate: new Date('2026-10-01'),
    dueDate: new Date('2026-11-01'),
    billingPeriod: {
      start: new Date('2026-10-01'),
      end: new Date('2026-10-31')
    },
    lines: [
      {
        description: 'Brightloop Core CRM (Brand: Odoo Integration Edition) - 5 seats',
        quantity: 5,
        unitPrice: 1010,
        taxRate: 18,
        taxAmount: 909,
        discountAmount: 1010,
        total: 4949
      },
      {
        description: 'AI Support Copilot Add-on - 2 units',
        quantity: 2,
        unitPrice: 180,
        taxRate: 18,
        taxAmount: 64.8,
        discountAmount: 72,
        total: 352.8
      }
    ],
    subtotal: 5410,
    taxAmount: 779.04,
    discountAmount: 1082,
    totalAmount: 5107.04,
    amountPaid: 0,
    amountDue: 5107.04,
    status: 'Confirmed',
    sentAt: new Date('2026-10-01'),
    notes: 'October billing cycle invoice.'
  });

  console.log('[Seed] Database successfully populated with realistic Brightloop demo data!');
}

module.exports = { seedDatabase };
