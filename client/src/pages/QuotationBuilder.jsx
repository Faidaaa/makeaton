import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  FileCheck, 
  ArrowLeft, 
  Layers, 
  DollarSign, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { api } from '../services/api';

export default function QuotationBuilder({ onNavigate, editQuotationId = null }) {
  // Catalog Data
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxRules, setTaxRules] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedTaxRate, setSelectedTaxRate] = useState(10);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [lineItems, setLineItems] = useState([]);
  const [isTemplate, setIsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch initial catalog data
  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      try {
        const [custRes, plansRes, prodsRes, taxesRes, tplsRes] = await Promise.all([
          api.getCustomers().catch(() => ({ data: [] })),
          api.getPlans().catch(() => ({ data: [] })),
          api.getProducts().catch(() => ({ data: [] })),
          api.getTaxes().catch(() => ({ data: [] })),
          api.getQuotationTemplates().catch(() => ({ data: [] }))
        ]);

        if (custRes?.data) setCustomers(custRes.data);
        if (plansRes?.data) setPlans(plansRes.data);
        if (prodsRes?.data) setProducts(prodsRes.data);
        if (taxesRes?.data) setTaxRules(taxesRes.data);
        if (tplsRes?.data) setTemplates(tplsRes.data);

        // Set defaults if available
        if (custRes?.data?.length > 0) setSelectedCustomerId(custRes.data[0].id);
        if (plansRes?.data?.length > 0) setSelectedPlanId(plansRes.data[0].id);
      } catch (err) {
        console.error('Catalog load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Handle template selection
  const handleApplyTemplate = (tplId) => {
    if (!tplId) return;
    const template = templates.find((t) => t._id === tplId || t.quotationNumber === tplId);
    if (!template) return;

    if (template.plan?.id) setSelectedPlanId(template.plan.id);
    if (template.paymentTerms) setPaymentTerms(template.paymentTerms);
    if (template.notes) setNotes(template.notes);
    if (template.items && template.items.length > 0) {
      setLineItems(
        template.items.map((it) => ({
          productId: it.productId,
          name: it.name,
          quantity: it.quantity || 1,
          unitPrice: it.unitPrice || 0,
          taxRate: it.taxRate !== undefined ? it.taxRate : selectedTaxRate
        }))
      );
    }
  };

  // Add line item
  const handleAddProduct = (prodId) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    // Check if item already exists in lineItems
    const existingIndex = lineItems.findIndex((it) => it.productId === prodId);
    if (existingIndex > -1) {
      const updated = [...lineItems];
      updated[existingIndex].quantity += 1;
      setLineItems(updated);
    } else {
      setLineItems([
        ...lineItems,
        {
          productId: prod.id,
          name: prod.name,
          quantity: 1,
          unitPrice: prod.unitPrice,
          taxRate: selectedTaxRate
        }
      ]);
    }
  };

  const handleUpdateQuantity = (index, delta) => {
    const updated = [...lineItems];
    const newQty = Math.max(1, (updated[index].quantity || 1) + delta);
    updated[index].quantity = newQty;
    setLineItems(updated);
  };

  const handleRemoveLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Financial Calculations
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const planPrice = selectedPlan?.basePrice || 0;
  const planTax = Math.round(planPrice * (selectedTaxRate / 100) * 100) / 100;

  const itemsSubtotal = lineItems.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
  const itemsTax = lineItems.reduce((acc, it) => {
    const rate = it.taxRate !== undefined ? it.taxRate : selectedTaxRate;
    return acc + (it.quantity * it.unitPrice * (rate / 100));
  }, 0);

  const subtotal = Math.round((planPrice + itemsSubtotal) * 100) / 100;
  const totalTax = Math.round((planTax + itemsTax) * 100) / 100;
  const grandTotal = Math.round((subtotal + totalTax) * 100) / 100;

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const customer = customers.find((c) => c.id === selectedCustomerId);
    if (!customer) {
      setErrorMessage('Please select a valid customer.');
      return;
    }
    if (!selectedPlan) {
      setErrorMessage('Please select a subscription plan.');
      return;
    }
    if (!expiryDate) {
      setErrorMessage('Please choose a valid quotation expiry date.');
      return;
    }
    if (new Date(expiryDate) <= new Date(startDate)) {
      setErrorMessage('Expiry date must be after the start date.');
      return;
    }
    if (isTemplate && !templateName.trim()) {
      setErrorMessage('Please provide a name for this template.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          company: customer.company
        },
        plan: {
          id: selectedPlan.id,
          name: selectedPlan.name,
          billingFrequency: selectedPlan.billingFrequency,
          basePrice: selectedPlan.basePrice
        },
        startDate,
        expiryDate,
        paymentTerms,
        defaultTaxRate: Number(selectedTaxRate),
        items: lineItems.map((it) => ({
          productId: it.productId,
          name: it.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          taxRate: it.taxRate
        })),
        isTemplate,
        templateName: isTemplate ? templateName.trim() : '',
        notes
      };

      const res = await api.createQuotation(payload);
      if (res && res.success) {
        setSuccessMessage(`Quotation ${res.data.quotationNumber} saved successfully!`);
        setTimeout(() => {
          onNavigate('quotations');
        }, 1200);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save quotation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bl-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => onNavigate('quotations')}
            className="flex items-center gap-1 text-sm font-semibold text-secondary hover:text-black mb-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> Back to Quotations
          </button>
          <h1>Create New Quotation</h1>
          <p className="text-secondary text-sm">
            Configure customer plan pricing, add-ons, tax rates, and terms.
          </p>
        </div>

        {/* Template Quick Loader */}
        {templates.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-secondary">LOAD TEMPLATE:</span>
            <select
              className="bl-select text-xs"
              style={{ width: 'auto', padding: '0.4rem 0.6rem' }}
              onChange={(e) => handleApplyTemplate(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>Choose a template...</option>
              {templates.map((tpl) => (
                <option key={tpl._id} value={tpl._id}>
                  {tpl.templateName || tpl.quotationNumber}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="bl-card mb-4" style={{ backgroundColor: '#fef2f2', borderColor: '#ef4444' }}>
          <div className="flex items-center gap-2">
            <AlertCircle size={18} color="#dc2626" />
            <span className="font-bold text-sm" style={{ color: '#991b1b' }}>{errorMessage}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bl-card mb-4" style={{ backgroundColor: '#ecfdf5', borderColor: '#10b981' }}>
          <div className="flex items-center gap-2">
            <FileCheck size={18} color="#059669" />
            <span className="font-bold text-sm" style={{ color: '#065f46' }}>{successMessage}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Column: Form Fields & Products */}
          <div className="flex flex-col gap-6">
            {/* Step 1: Customer & Plan Selection */}
            <Card title="1. Customer & Plan Selection">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="bl-form-group">
                  <label className="bl-label">Select Customer *</label>
                  <select
                    className="bl-select"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.company || c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bl-form-group">
                  <label className="bl-label">Base Subscription Plan *</label>
                  <select
                    className="bl-select"
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    required
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · ${p.basePrice}/{p.billingFrequency}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Term & Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                <div className="bl-form-group">
                  <label className="bl-label">Start Date</label>
                  <input
                    type="date"
                    className="bl-input font-mono text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="bl-form-group">
                  <label className="bl-label">Validity / Expiry Date *</label>
                  <input
                    type="date"
                    className="bl-input font-mono text-sm"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                  />
                </div>

                <div className="bl-form-group">
                  <label className="bl-label">Payment Terms</label>
                  <select
                    className="bl-select"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                  >
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Step 2: Line Items & Add-ons */}
            <Card title="2. Product Line Items & Add-ons">
              {/* Add product dropdown */}
              <div className="flex items-center gap-3 mb-4">
                <select
                  id="product-picker"
                  className="bl-select"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddProduct(e.target.value);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="" disabled>Select product to add from catalog...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${p.unitPrice}
                    </option>
                  ))}
                </select>
              </div>

              {/* Line items table */}
              <div className="bl-table-container">
                <table className="bl-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style={{ width: '100px' }}>Unit Price</th>
                      <th style={{ width: '120px' }}>Quantity</th>
                      <th style={{ width: '100px' }}>Line Total</th>
                      <th style={{ width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Base Plan Item */}
                    <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
                      <td>
                        <div className="font-bold">{selectedPlan?.name || 'Selected Plan'}</div>
                        <div className="text-xs text-secondary font-mono">Base Plan ({selectedPlan?.billingFrequency})</div>
                      </td>
                      <td className="font-mono">${planPrice.toFixed(2)}</td>
                      <td className="font-mono">1 (Included)</td>
                      <td className="font-mono font-bold">${planPrice.toFixed(2)}</td>
                      <td></td>
                    </tr>

                    {/* Dynamic line items */}
                    {lineItems.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                          No add-on products added yet. Use the dropdown above to add catalog products.
                        </td>
                      </tr>
                    ) : (
                      lineItems.map((item, index) => (
                        <tr key={item.productId || index}>
                          <td>
                            <div className="font-semibold">{item.name}</div>
                          </td>
                          <td className="font-mono">${item.unitPrice.toFixed(2)}</td>
                          <td>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(index, -1)}
                                className="bl-btn bl-btn-sm bl-btn-outline"
                                style={{ padding: '0.1rem 0.4rem' }}
                              >
                                -
                              </button>
                              <span className="font-mono font-bold px-2">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(index, 1)}
                                className="bl-btn bl-btn-sm bl-btn-outline"
                                style={{ padding: '0.1rem 0.4rem' }}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="font-mono font-bold">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(index)}
                              className="text-secondary hover:text-black p-1"
                              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                              title="Remove item"
                            >
                              <Trash2 size={16} color="#dc2626" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Step 3: Template & Notes */}
            <Card title="3. Quotation Options & Notes">
              <div className="bl-form-group mb-4">
                <label className="bl-label">Special Terms & Notes</label>
                <textarea
                  className="bl-textarea"
                  rows="3"
                  placeholder="Enter client-specific terms, SLA notes, or payment notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>

              {/* Template Saving Toggle */}
              <div 
                className="bl-card-subtle flex items-start gap-3"
                style={{ cursor: 'pointer' }}
                onClick={() => setIsTemplate(!isTemplate)}
              >
                <input
                  type="checkbox"
                  id="save-template-check"
                  checked={isTemplate}
                  onChange={(e) => setIsTemplate(e.target.checked)}
                  style={{ marginTop: '0.2rem', accentColor: 'var(--accent-primary)' }}
                />
                <div style={{ flex: 1 }}>
                  <label htmlFor="save-template-check" className="font-bold text-sm cursor-pointer">
                    Save as Reusable Quotation Template
                  </label>
                  <p className="text-secondary text-xs">
                    Allows staff to instantly pre-load this bundle and terms for future prospects.
                  </p>

                  {isTemplate && (
                    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                      <label className="bl-label text-xs">Template Name *</label>
                      <input
                        type="text"
                        className="bl-input text-sm"
                        placeholder="e.g. Enterprise Cloud Bundle"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        required={isTemplate}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Financial Summary & Actions */}
          <div style={{ position: 'sticky', top: '1rem' }}>
            <Card title="Financial Breakdown">
              {/* Applicable Tax Selection */}
              <div className="bl-form-group mb-4">
                <label className="bl-label">Tax Region / Rate</label>
                <select
                  className="bl-select font-mono text-sm"
                  value={selectedTaxRate}
                  onChange={(e) => setSelectedTaxRate(Number(e.target.value))}
                >
                  {taxRules.map((tax, i) => (
                    <option key={i} value={tax.rate}>
                      {tax.region} ({tax.rate}%)
                    </option>
                  ))}
                  <option value={0}>Zero Tax (0%)</option>
                </select>
              </div>

              {/* Calculation Summary Rows */}
              <div className="flex flex-col gap-2 pt-3" style={{ borderTop: '2px solid var(--border-strong)' }}>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Base Plan Subtotal:</span>
                  <span className="font-mono font-semibold">${planPrice.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Add-ons Subtotal:</span>
                  <span className="font-mono font-semibold">${itemsSubtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <span className="font-bold">Subtotal:</span>
                  <span className="font-mono font-bold">${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Estimated Tax ({selectedTaxRate}%):</span>
                  <span className="font-mono font-semibold">${totalTax.toFixed(2)}</span>
                </div>

                <div 
                  className="flex justify-between items-baseline pt-3 mt-2" 
                  style={{ borderTop: '2px solid var(--border-strong)' }}
                >
                  <span className="font-bold text-base">Final Quotation Total:</span>
                  <span className="font-mono text-xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col gap-3 mt-6">
                <Button
                  type="submit"
                  variant="primary"
                  icon={Save}
                  disabled={submitting}
                  style={{ width: '100%' }}
                >
                  {submitting ? 'Saving Quotation...' : 'Save & Generate Quotation'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onNavigate('quotations')}
                  style={{ width: '100%' }}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
