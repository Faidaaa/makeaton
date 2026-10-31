import mongoose from 'mongoose';

const subscriptionLineItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 10 },
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  total: { type: Number, required: true }
});

const statusHistorySchema = new mongoose.Schema({
  fromStatus: { type: String },
  toStatus: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  changedBy: { type: String, default: 'Staff Member' },
  note: { type: String }
});

const subscriptionSchema = new mongoose.Schema(
  {
    subscriptionNumber: { type: String, required: true, unique: true },
    quotationNumber: { type: String },
    customer: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
      company: { type: String }
    },
    plan: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      billingFrequency: { type: String, default: 'Monthly' },
      basePrice: { type: Number, default: 0 }
    },
    items: [subscriptionLineItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'],
      default: 'Draft',
      required: true
    },
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    renewalDate: { type: Date },
    isPaused: { type: Boolean, default: false },
    pausedAt: { type: Date },
    history: [statusHistorySchema]
  },
  { timestamps: true }
);

export default mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
