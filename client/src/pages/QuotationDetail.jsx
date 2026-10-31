import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  CreditCard, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Repeat,
  Printer
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { api } from '../services/api';

export default function QuotationDetail({ quotationId, onNavigate }) {
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.getQuotationById(quotationId);
      if (res && res.data) {
        setQuotation(res.data);
      } else {
        setError('Quotation not found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load quotation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [quotationId]);

  const handleConvert = async () => {
    setConverting(true);
    try {
      const res = await api.convertQuotation(quotationId);
      if (res && res.success) {
        setActionSuccess(res.message);
        setConvertModalOpen(false);
        fetchDetail();
      }
    } catch (err) {
      setError(err.message || 'Conversion failed.');
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="bl-container">
        <p className="text-secondary font-mono">Loading quotation details...</p>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="bl-container">
        <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => onNavigate('quotations')}>
          Back to Quotations
        </Button>
        <div className="bl-card mt-4" style={{ borderColor: '#dc2626' }}>
          <p className="font-bold text-red-600">{error || 'Quotation could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  const isExpired = new Date(quotation.expiryDate) < new Date();
  const canConvert = quotation.status !== 'Accepted' && quotation.status !== 'Rejected' && !isExpired;

  return (
    <div className="bl-container">
      {/* Top Navigation & Status */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <button
            onClick={() => onNavigate('quotations')}
            className="flex items-center gap-1 text-sm font-semibold text-secondary hover:text-black mb-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> Back to Quotations
          </button>
          <div className="flex items-center gap-3">
            <h1 className="font-mono">{quotation.quotationNumber}</h1>
            <Badge status={quotation.status} />
            {quotation.isTemplate && (
              <span className="bl-badge" style={{ backgroundColor: '#e0e7ff', borderColor: '#4f46e5', color: '#4338ca' }}>
                TEMPLATE: {quotation.templateName}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={() => window.print()}
          >
            Print Quotation
          </Button>

          {canConvert && (
            <Button
              variant="primary"
              size="sm"
              icon={Repeat}
              onClick={() => setConvertModalOpen(true)}
            >
              Convert to Subscription
            </Button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="bl-card mb-4" style={{ backgroundColor: '#ecfdf5', borderColor: '#10b981' }}>
          <div className="flex items-center gap-2">
            <CheckCircle size={18} color="#059669" />
            <span className="font-bold text-sm" style={{ color: '#065f46' }}>{actionSuccess}</span>
          </div>
        </div>
      )}

      {/* Overview Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Customer & Plan Details */}
        <Card title="Customer & Subscription Plan">
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-xs font-bold text-secondary font-mono">CUSTOMER</span>
              <div className="font-bold text-base">{quotation.customer?.name}</div>
              <div className="text-xs text-secondary font-mono">{quotation.customer?.email}</div>
              {quotation.customer?.company && (
                <div className="text-xs text-secondary">{quotation.customer.company}</div>
              )}
            </div>

            <div className="pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <span className="text-xs font-bold text-secondary font-mono">SELECTED PLAN</span>
              <div className="font-bold">{quotation.plan?.name}</div>
              <div className="text-xs text-secondary font-mono">
                ${quotation.plan?.basePrice} · {quotation.plan?.billingFrequency} billing frequency
              </div>
            </div>
          </div>
        </Card>

        {/* Validity & Terms */}
        <Card title="Quotation Validity & Terms">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between">
              <span className="text-xs font-bold text-secondary font-mono">START DATE:</span>
              <span className="font-mono text-sm">{new Date(quotation.startDate).toLocaleDateString()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-xs font-bold text-secondary font-mono">VALID UNTIL:</span>
              <span className="font-mono text-sm font-bold" style={{ color: isExpired ? '#dc2626' : 'inherit' }}>
                {new Date(quotation.expiryDate).toLocaleDateString()}
                {isExpired && ' (EXPIRED)'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-xs font-bold text-secondary font-mono">PAYMENT TERMS:</span>
              <span className="font-mono text-sm">{quotation.paymentTerms || 'Net 30'}</span>
            </div>

            {quotation.notes && (
              <div className="pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <span className="text-xs font-bold text-secondary font-mono">SPECIAL NOTES:</span>
                <p className="text-xs mt-1 text-secondary">{quotation.notes}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Product Line Items Breakdown Table */}
      <Card title="Line Items & Add-ons Breakdown" className="mb-6">
        <div className="bl-table-container">
          <table className="bl-table">
            <thead>
              <tr>
                <th>Product Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Tax Rate</th>
                <th>Tax Amount</th>
                <th style={{ textAlign: 'right' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Plan Row */}
              <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
                <td>
                  <div className="font-bold">{quotation.plan?.name} (Base Plan)</div>
                  <div className="text-xs text-secondary font-mono">Recurring Base Subscription</div>
                </td>
                <td className="font-mono">1</td>
                <td className="font-mono">${Number(quotation.plan?.basePrice || 0).toFixed(2)}</td>
                <td className="font-mono">10%</td>
                <td className="font-mono">${Number((quotation.plan?.basePrice || 0) * 0.1).toFixed(2)}</td>
                <td className="font-mono font-bold" style={{ textAlign: 'right' }}>
                  ${Number((quotation.plan?.basePrice || 0) * 1.1).toFixed(2)}
                </td>
              </tr>

              {/* Items Rows */}
              {quotation.items && quotation.items.length > 0 ? (
                quotation.items.map((it, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="font-semibold">{it.name}</div>
                      <div className="text-xs text-secondary font-mono">ID: {it.productId}</div>
                    </td>
                    <td className="font-mono">{it.quantity}</td>
                    <td className="font-mono">${Number(it.unitPrice || 0).toFixed(2)}</td>
                    <td className="font-mono">{it.taxRate}%</td>
                    <td className="font-mono">${Number(it.taxAmount || 0).toFixed(2)}</td>
                    <td className="font-mono font-bold" style={{ textAlign: 'right' }}>
                      ${Number(it.total || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
                    No additional add-ons included in this quotation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end mt-4">
          <div style={{ width: '320px' }}>
            <div className="flex justify-between py-1 text-sm">
              <span className="text-secondary">Subtotal:</span>
              <span className="font-mono font-semibold">${Number(quotation.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 text-sm">
              <span className="text-secondary">Applicable Tax:</span>
              <span className="font-mono font-semibold">${Number(quotation.taxAmount || 0).toFixed(2)}</span>
            </div>
            <div 
              className="flex justify-between py-2 mt-1 text-base font-bold" 
              style={{ borderTop: '2px solid var(--border-strong)', borderBottom: '2px solid var(--border-strong)' }}
            >
              <span>Quotation Total:</span>
              <span className="font-mono" style={{ color: 'var(--accent-primary)' }}>
                ${Number(quotation.totalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Convert Confirmation Modal */}
      <Modal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        title="Convert Quotation to Subscription"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setConvertModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConvert} disabled={converting}>
              {converting ? 'Processing...' : 'Confirm Conversion'}
            </Button>
          </>
        }
      >
        <p className="text-sm mb-3">
          Convert quotation <strong>{quotation.quotationNumber}</strong> into an active subscription?
        </p>
        <div className="bl-card-subtle text-xs font-mono">
          <div>Customer: {quotation.customer?.name}</div>
          <div>Plan: {quotation.plan?.name}</div>
          <div>Total Value: ${Number(quotation.totalAmount || 0).toFixed(2)}</div>
        </div>
      </Modal>
    </div>
  );
}
