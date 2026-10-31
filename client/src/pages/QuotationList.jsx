import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  RefreshCw, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Send
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { api } from '../services/api';

export default function QuotationList({ onNavigate }) {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Conversion Confirmation Modal
  const [conversionModalOpen, setConversionModalOpen] = useState(false);
  const [selectedQuoteForConvert, setSelectedQuoteForConvert] = useState(null);
  const [isConverting, setIsConverting] = useState(false);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search && search.trim()) params.search = search.trim();
      if (statusFilter && statusFilter !== 'All') params.status = statusFilter;

      const res = await api.getQuotations(params);
      if (res && res.data) {
        setQuotations(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQuotations();
  };

  // Convert Quote to Subscription
  const handleConfirmConvert = async () => {
    if (!selectedQuoteForConvert) return;
    setIsConverting(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await api.convertQuotation(selectedQuoteForConvert._id || selectedQuoteForConvert.quotationNumber);
      if (res && res.success) {
        setActionSuccess(res.message);
        setConversionModalOpen(false);
        fetchQuotations();
      }
    } catch (err) {
      setActionError(err.message || 'Failed to convert quotation.');
    } finally {
      setIsConverting(false);
    }
  };

  const statuses = ['All', 'Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'];

  return (
    <div className="bl-container">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-secondary font-bold">PROPOSALS & QUOTATIONS</span>
          </div>
          <h1>Quotation Management</h1>
          <p className="text-secondary text-sm">
            Create, track, and convert sales quotations into active recurring subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchQuotations}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => onNavigate('quotation-new')}
          >
            Build New Quotation
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="bl-card mb-4" style={{ backgroundColor: '#ecfdf5', borderColor: '#10b981' }}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} color="#059669" />
            <span className="font-bold text-sm" style={{ color: '#065f46' }}>{actionSuccess}</span>
          </div>
        </div>
      )}

      {actionError && (
        <div className="bl-card mb-4" style={{ backgroundColor: '#fef2f2', borderColor: '#ef4444' }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} color="#dc2626" />
            <span className="font-bold text-sm" style={{ color: '#991b1b' }}>{actionError}</span>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <Card className="mb-6" style={{ padding: '0.85rem 1rem' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-secondary font-mono mr-1">STATUS:</span>
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`bl-btn bl-btn-sm ${statusFilter === st ? 'bl-btn-primary' : 'bl-btn-outline'}`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search quotes or customers..."
              className="bl-input text-xs"
              style={{ width: '240px', padding: '0.4rem 0.6rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" variant="outline" size="sm" icon={Search}>
              Search
            </Button>
          </form>
        </div>
      </Card>

      {/* Structured Quotation Table */}
      <div className="bl-table-container">
        <table className="bl-table">
          <thead>
            <tr>
              <th>Quotation #</th>
              <th>Customer</th>
              <th>Plan Details</th>
              <th>Start Date</th>
              <th>Valid Until</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading quotations...
                </td>
              </tr>
            ) : quotations.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                  No quotations found. Click "Build New Quotation" to create one.
                </td>
              </tr>
            ) : (
              quotations.map((q) => {
                const isExpired = new Date(q.expiryDate) < new Date();
                const canConvert = q.status !== 'Accepted' && q.status !== 'Rejected' && !isExpired;

                return (
                  <tr key={q._id || q.quotationNumber}>
                    <td className="font-mono font-bold" style={{ color: 'var(--accent-secondary)' }}>
                      {q.quotationNumber}
                    </td>
                    <td>
                      <div className="font-semibold">{q.customer?.name}</div>
                      <div className="text-xs text-secondary font-mono">{q.customer?.company || q.customer?.email}</div>
                    </td>
                    <td>
                      <div className="font-semibold">{q.plan?.name}</div>
                      <div className="text-xs text-secondary font-mono">
                        ${q.plan?.basePrice}/{q.plan?.billingFrequency}
                      </div>
                    </td>
                    <td className="font-mono text-xs">
                      {new Date(q.startDate).toLocaleDateString()}
                    </td>
                    <td className="font-mono text-xs">
                      {new Date(q.expiryDate).toLocaleDateString()}
                      {isExpired && (
                        <span className="text-xs ml-1 font-bold" style={{ color: '#dc2626' }}>(Expired)</span>
                      )}
                    </td>
                    <td className="font-mono font-bold">
                      ${Number(q.totalAmount || 0).toFixed(2)}
                    </td>
                    <td>
                      <Badge status={q.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onNavigate(`quotation-detail-${q._id || q.quotationNumber}`)}
                        >
                          View
                        </Button>
                        {canConvert && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedQuoteForConvert(q);
                              setConversionModalOpen(true);
                            }}
                          >
                            Convert
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Convert to Subscription Confirmation Modal */}
      <Modal
        isOpen={conversionModalOpen}
        onClose={() => setConversionModalOpen(false)}
        title="Confirm Quotation Conversion"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConversionModalOpen(false)}
              disabled={isConverting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmConvert}
              disabled={isConverting}
            >
              {isConverting ? 'Converting...' : 'Confirm & Generate Subscription'}
            </Button>
          </>
        }
      >
        <p className="text-sm mb-3">
          Are you sure you want to convert quotation{' '}
          <strong className="font-mono">{selectedQuoteForConvert?.quotationNumber}</strong> for{' '}
          <strong>{selectedQuoteForConvert?.customer?.name}</strong>?
        </p>
        <div className="bl-card-subtle text-xs font-mono">
          <div>Plan: {selectedQuoteForConvert?.plan?.name}</div>
          <div>Total Amount: ${Number(selectedQuoteForConvert?.totalAmount || 0).toFixed(2)}</div>
          <div>New State: Confirmed Subscription</div>
        </div>
        <p className="text-xs text-secondary mt-3">
          This will automatically mark the quotation as <strong>Accepted</strong> and provision a new Confirmed Subscription in the lifecycle pipeline.
        </p>
      </Modal>
    </div>
  );
}
