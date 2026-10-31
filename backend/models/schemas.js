const mongoose = require('mongoose');

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff', 'customer'], default: 'customer' },
  company: { type: String, default: '' },
  phone: { type: String, default: '' },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

// Product Schema
const VariantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  priceAdjustment: { type: Number, default: 0 },
  costAdjustment: { type: Number, default: 0 },
  sku: { type: String, default: '' }
});

const BrandVariantSchema = new mongoose.Schema({
  brandName: { type: String, required: true },
  surcharge: { type: Number, default: 0, min: 0 }
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Software', 'Add-on', 'Service', 'Hardware'], default: 'Software' },
  salesPrice: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, default: 0, min: 0 },
  brandVariants: [BrandVariantSchema],
  variants: [VariantSchema],
  notes: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Plan Schema
const PlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
  billingFrequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], default: 'monthly' },
  cost: { type: Number, required: true, min: 0 },
  minQuantity: { type: Number, default: 1, min: 1 },
  availableFrom: { type: Date, default: Date.now },
  availableTo: { type: Date, default: null },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, default: null },
  autoCloseOnEnd: { type: Boolean, default: false },
  autoCloseAtEnd: { type: Boolean, default: false },
  allowEarlyClose: { type: Boolean, default: true },
  allowPause: { type: Boolean, default: true },
  allowRenewal: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Quotation Template Schema
const QuotationTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
  validityDays: { type: Number, default: 30 },
  paymentTerms: { type: String, default: 'Net 30' },
  lines: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    variantName: { type: String, default: 'Standard' },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    taxRate: { type: Number, default: 10 }
  }],
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Subscription Schema
const SubscriptionLineSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  variant: { type: String, default: 'Standard' },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  amount: { type: Number, required: true, min: 0 }
});

const SubscriptionSchema = new mongoose.Schema({
  subscriptionNumber: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  quotationTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuotationTemplate' },
  startDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  nextBillingDate: { type: Date },
  paymentTerms: { type: String, default: 'Net 30' },
  lines: [SubscriptionLineSchema],
  subtotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  discountTotal: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  appliedDiscountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Discount' },
  status: { 
    type: String, 
    enum: ['Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed'], 
    default: 'Draft' 
  },
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: String,
    note: String
  }],
  lastBilledDate: { type: Date, default: null },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Discount Rule Schema
const DiscountSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  value: { type: Number, required: true, min: 0 },
  minQuantity: { type: Number, default: 0, min: 0 },
  minPurchaseAmount: { type: Number, default: 0, min: 0 },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  usageLimit: { type: Number, default: 100 },
  usageCount: { type: Number, default: 0 },
  appliesTo: { type: String, enum: ['whole_subscription', 'specific_products'], default: 'whole_subscription' },
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Tax Rule Schema
const TaxRuleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rate: { type: Number, required: true, min: 0, max: 100 }, // e.g. 18 for 18%
  country: { type: String, default: 'Global' },
  taxType: { type: String, default: 'VAT' },
  isDefault: { type: Boolean, default: false },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Invoice Schema
const InvoiceLineSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  total: { type: Number, required: true }
});

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  billingPeriod: {
    start: { type: Date },
    end: { type: Date }
  },
  lines: [InvoiceLineSchema],
  subtotal: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  amountDue: { type: Number, required: true },
  status: { type: String, enum: ['Draft', 'Confirmed', 'Paid', 'Cancelled'], default: 'Draft' },
  sentAt: { type: Date, default: null },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Payment Schema
const PaymentSchema = new mongoose.Schema({
  paymentNumber: { type: String, required: true, unique: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0.01 },
  paymentMethod: { 
    type: String, 
    enum: ['Bank Transfer', 'Credit Card', 'Stripe', 'UPI', 'Cheque', 'Cash'], 
    default: 'Bank Transfer' 
  },
  paymentDate: { type: Date, default: Date.now },
  reference: { type: String, default: '' },
  note: { type: String, default: '' },
  recordedBy: { type: String, default: 'System' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  UserSchema,
  ProductSchema,
  PlanSchema,
  QuotationTemplateSchema,
  SubscriptionSchema,
  DiscountSchema,
  TaxRuleSchema,
  InvoiceSchema,
  PaymentSchema
};
