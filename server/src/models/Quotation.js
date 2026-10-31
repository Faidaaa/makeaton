import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 10 },
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  total: { type: Number, required: true }
});

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: { type: String, required: true, unique: true },
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
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    paymentTerms: { type: String, default: 'Net 30' },
    items: [lineItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'],
      default: 'Draft'
    },
    isTemplate: { type: Boolean, default: false },
    templateName: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
);

export default mongoose.models.Quotation || mongoose.model('Quotation', quotationSchema);
