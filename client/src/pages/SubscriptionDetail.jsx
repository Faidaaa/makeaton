import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  PauseCircle, 
  PlayCircle, 
  RefreshCw, 
  Calendar, 
  History,
  ShieldCheck,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { api } from '../services/api';

const LIFECYCLE_STAGES = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];

export default function SubscriptionDetail({ subscriptionId, onNavigate }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Transition Modal State
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [transitionNote, setTransitionNote] = useState('');
  const [isSubmittingTransition, setIsSubmittingTransition] = useState(false);

  // Renewal Modal State
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [renewMonths, setRenewMonths] = useState(12);
  const [isRenewing, setIsRenewing] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.getSubscriptionById(subscriptionId);
      if (res && res.data) {
        setSubscription(res.data);
      } else {
        setError('Subscription not found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load subscription.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [subscriptionId]);

  // Handle Lifecycle Status Transition
  const handleOpenTransitionModal = (nextStatus) => {
    setTargetStatus(nextStatus);
    setTransitionNote(`Staff manual transition to ${nextStatus}`);
    setTransitionModalOpen(true);
  };

  const handleExecuteTransition = async () => {
    setIsSubmittingTransition(true);
    setError('');
    setActionSuccess('');

    try {
      const res = await api.transitionSubscriptionStatus(
        subscriptionId,
        targetStatus,
        transitionNote
      );
      if (res && res.success) {
        setActionSuccess(`Lifecycle stage advanced to ${targetStatus}!`);
        setTransitionModalOpen(false);
        fetchDetail();
      }
    } catch (err) {
      setError(err.message || 'Transition rejected by system rules.');
    } finally {
      setIsSubmittingTransition(false);
    }
  };

  // Handle Pause / Resume Toggle
  const handleTogglePause = async () => {
    setError('');
    setActionSuccess('');
    try {
      const res = await api.togglePauseSubscription(subscriptionId);
      if (res && res.success) {
        setActionSuccess(res.message);
        fetchDetail();
      }
    } catch (err) {
      setError(err.message || 'Failed to toggle pause state.');
    }
  };

  // Handle Renewal
  const handleExecuteRenew = async () => {
    setIsRenewing(true);
    setError('');
    setActionSuccess('');
    try {
      const res = await api.renewSubscription(subscriptionId, renewMonths);
      if (res && res.success) {
        setActionSuccess(`Subscription term extended by +${renewMonths} months.`);
        setRenewModalOpen(false);
        fetchDetail();
      }
    } catch (err) {
      setError(err.message || 'Failed to renew subscription.');
    } finally {
      setIsRenewing(false);
    }
  };

  if (loading) {
    return (
      <div className="bl-container">
        <p className="font-mono text-secondary">Loading subscription details...</p>
      </div>
    );
  }

  if (error && !subscription) {
    return (
      <div className="bl-container">
        <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => onNavigate('subscriptions')}>
          Back to Subscriptions
        </Button>
        <div className="bl-card mt-4" style={{ borderColor: '#dc2626' }}>
          <p className="font-bold text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const currentStatus = subscription?.status || 'Draft';
  const currentIndex = LIFECYCLE_STAGES.indexOf(currentStatus);

  // Determine permitted next transitions based on lifecycle rules
  const getPermittedTransitions = () => {
    switch (currentStatus) {
      case 'Draft':
        return [
          { status: 'Quotation', label: 'Convert to Formal Quotation', variant: 'primary' },
          { status: 'Closed', label: 'Cancel & Close Draft', variant: 'danger' }
        ];
      case 'Quotation':
        return [
          { status: 'Confirmed', label: 'Confirm Subscription Agreement', variant: 'primary' },
          { status: 'Draft', label: 'Revert to Draft for Revision', variant: 'outline' },
          { status: 'Closed', label: 'Reject / Close Quotation', variant: 'danger' }
        ];
      case 'Confirmed':
        return [
          { status: 'Active', label: 'Provision & Activate Service', variant: 'primary' },
          { status: 'Closed', label: 'Cancel Before Activation', variant: 'danger' }
        ];
      case 'Active':
        return [
          { status: 'Closed', label: 'Terminate & Close Subscription', variant: 'danger' }
        ];
      case 'Closed':
        return [
          { status: 'Draft', label: 'Re-open as New Contract Draft', variant: 'outline' }
        ];
      default:
        return [];
    }
  };

  const permittedActions = getPermittedTransitions();

  return (
    <div className="bl-container">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <button
            onClick={() => onNavigate('subscriptions')}
            className="flex items-center gap-1 text-sm font-semibold text-secondary hover:text-black mb-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> Back to Subscriptions
          </button>
          <div className="flex items-center gap-3">
            <h1 className="font-mono">{subscription.subscriptionNumber}</h1>
            <Badge status={subscription.status} />
            {subscription.isPaused && (
              <span 
                className="bl-badge" 
                style={{ backgroundColor: '#fef3c7', borderColor: '#d97706', color: '#92400e' }}
              >
                PAUSED
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Pause / Resume Button (Only for Active) */}
          {subscription.status === 'Active' && (
            <Button
              variant={subscription.isPaused ? 'secondary' : 'outline'}
              size="sm"
              icon={subscription.isPaused ? PlayCircle : PauseCircle}
              onClick={handleTogglePause}
            >
              {subscription.isPaused ? 'Resume Subscription' : 'Pause Subscription'}
            </Button>
          )}

          {/* Renew Button (For Confirmed or Active) */}
          {subscription.status !== 'Closed' && (
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => setRenewModalOpen(true)}
            >
              Extend / Renew Term
            </Button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="bl-card mb-4" style={{ backgroundColor: '#ecfdf5', borderColor: '#10b981' }}>
          <div className="flex items-center gap-2">
            <CheckCircle size={18} color="#059669" />
            <span className="font-bold text-sm" style={{ color: '#065f46' }}>{actionSuccess}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bl-card mb-4" style={{ backgroundColor: '#fef2f2', borderColor: '#ef4444' }}>
          <div className="flex items-center gap-2">
            <AlertCircle size={18} color="#dc2626" />
            <span className="font-bold text-sm" style={{ color: '#991b1b' }}>{error}</span>
          </div>
        </div>
      )}

      {/* Lifecycle Visual Stepper */}
      <Card title="Mandatory Lifecycle Progression Pipeline" className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2 py-4">
          {LIFECYCLE_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isPending = idx > currentIndex;

            let bgColor = 'var(--bg-subtle)';
            let textColor = 'var(--text-secondary)';
            let borderColor = 'var(--border-subtle)';

            if (isCurrent) {
              bgColor = 'var(--accent-primary)';
              textColor = '#ffffff';
              borderColor = '#000000';
            } else if (isCompleted) {
              bgColor = '#d1fae5';
              textColor = '#065f46';
              borderColor = '#10b981';
            }

            return (
              <React.Fragment key={stage}>
                <div 
                  className="flex items-center gap-2"
                  style={{
                    backgroundColor: bgColor,
                    color: textColor,
                    border: `2px solid ${borderColor}`,
                    boxShadow: isCurrent ? '2px 2px 0px #000000' : 'none',
                    padding: '0.5rem 0.85rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem'
                  }}
                >
                  <span>{idx + 1}.</span>
                  <span>{stage.toUpperCase()}</span>
                  {isCompleted && <span>✓</span>}
                </div>

                {idx < LIFECYCLE_STAGES.length - 1 && (
                  <ArrowRight size={16} color="var(--border-strong)" style={{ opacity: 0.6 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Transition Action Buttons */}
        <div 
          className="flex items-center justify-between flex-wrap gap-3 pt-4 mt-2" 
          style={{ borderTop: '2px solid var(--border-strong)' }}
        >
          <div>
            <span className="font-mono text-xs font-bold text-secondary">
              CURRENT STAGE: <strong style={{ color: 'var(--accent-primary)' }}>{currentStatus}</strong>
            </span>
            <p className="text-xs text-secondary">
              State transitions are strictly validated. Invalid jumps are prevented.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {permittedActions.map((act) => (
              <Button
                key={act.status}
                variant={act.variant}
                size="sm"
                onClick={() => handleOpenTransitionModal(act.status)}
              >
                {act.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Customer & Plan */}
        <Card title="Customer Account & Plan Tier">
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-xs font-bold text-secondary font-mono">ACCOUNT</span>
              <div className="font-bold text-base">{subscription.customer?.name}</div>
              <div className="text-xs text-secondary font-mono">{subscription.customer?.email}</div>
              {subscription.customer?.company && (
                <div className="text-xs text-secondary">{subscription.customer.company}</div>
              )}
            </div>

            <div className="pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <span className="text-xs font-bold text-secondary font-mono">SUBSCRIPTION PLAN</span>
              <div className="font-bold">{subscription.plan?.name}</div>
              <div className="text-xs text-secondary font-mono">
                ${subscription.plan?.basePrice} / {subscription.plan?.billingFrequency}
              </div>
            </div>
          </div>
        </Card>

        {/* Term & Renewal Dates */}
        <Card title="Subscription Dates & Billing Cycle">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-xs font-bold text-secondary font-mono">START DATE:</span>
              <span className="font-mono text-sm">{new Date(subscription.startDate).toLocaleDateString()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-xs font-bold text-secondary font-mono">EXPIRY DATE:</span>
              <span className="font-mono text-sm font-bold">
                {new Date(subscription.expiryDate).toLocaleDateString()}
              </span>
            </div>

            {subscription.renewalDate && (
              <div className="flex justify-between">
                <span className="text-xs font-bold text-secondary font-mono">SCHEDULED RENEWAL:</span>
                <span className="font-mono text-sm text-secondary">
                  {new Date(subscription.renewalDate).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="flex justify-between pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <span className="text-xs font-bold text-secondary font-mono">TOTAL RECURRING VALUE:</span>
              <span className="font-mono text-base font-bold" style={{ color: 'var(--accent-secondary)' }}>
                ${Number(subscription.totalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Line Items Table */}
      {subscription.items && subscription.items.length > 0 && (
        <Card title="Contract Line Items & Add-ons" className="mb-6">
          <div className="bl-table-container">
            <table className="bl-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Tax</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {subscription.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold">{it.name}</td>
                    <td className="font-mono">{it.quantity}</td>
                    <td className="font-mono">${Number(it.unitPrice || 0).toFixed(2)}</td>
                    <td className="font-mono">${Number(it.taxAmount || 0).toFixed(2)}</td>
                    <td className="font-mono font-bold" style={{ textAlign: 'right' }}>
                      ${Number(it.total || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Lifecycle Audit Trail / History Timeline */}
      <Card title="Subscription Lifecycle Audit Trail (History)">
        <div className="flex flex-col gap-3">
          {(!subscription.history || subscription.history.length === 0) ? (
            <p className="text-secondary text-sm">No state transitions recorded yet.</p>
          ) : (
            subscription.history.map((record, idx) => (
              <div 
                key={idx}
                className="bl-card-subtle flex items-start justify-between flex-wrap gap-2"
                style={{ padding: '0.75rem 1rem' }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--accent-secondary)' }}>
                      {record.fromStatus ? `${record.fromStatus} → ` : ''}{record.toStatus}
                    </span>
                    <span className="text-xs text-secondary font-mono">
                      by {record.changedBy || 'Staff Member'}
                    </span>
                  </div>
                  {record.note && (
                    <p className="text-xs text-secondary">{record.note}</p>
                  )}
                </div>

                <div className="font-mono text-xs text-secondary">
                  {new Date(record.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* State Transition Confirmation Dialog */}
      <Modal
        isOpen={transitionModalOpen}
        onClose={() => setTransitionModalOpen(false)}
        title={`Confirm Lifecycle Advance: Move to ${targetStatus}`}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransitionModalOpen(false)}
              disabled={isSubmittingTransition}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExecuteTransition}
              disabled={isSubmittingTransition}
            >
              {isSubmittingTransition ? 'Updating...' : `Confirm Transition to ${targetStatus}`}
            </Button>
          </>
        }
      >
        <div className="bl-card-subtle mb-4 text-xs font-mono">
          <div>Subscription: {subscription.subscriptionNumber}</div>
          <div>Current Status: {subscription.status}</div>
          <div>New Target Status: <strong>{targetStatus}</strong></div>
        </div>

        <div className="bl-form-group">
          <label className="bl-label text-xs">Audit Trail Note *</label>
          <textarea
            className="bl-textarea text-xs"
            rows="3"
            value={transitionNote}
            onChange={(e) => setTransitionNote(e.target.value)}
            placeholder="Document reason for transition (e.g. Agreement signed, provisioned)..."
            required
          ></textarea>
        </div>
      </Modal>

      {/* Renewal Modal Dialog */}
      <Modal
        isOpen={renewModalOpen}
        onClose={() => setRenewModalOpen(false)}
        title="Extend / Renew Subscription Term"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRenewModalOpen(false)}
              disabled={isRenewing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExecuteRenew}
              disabled={isRenewing}
            >
              {isRenewing ? 'Processing Renewal...' : 'Confirm Renewal Extension'}
            </Button>
          </>
        }
      >
        <p className="text-sm mb-3">
          Select renewal duration to extend subscription <strong>{subscription.subscriptionNumber}</strong>:
        </p>

        <div className="bl-form-group">
          <label className="bl-label text-xs">Renewal Extension Period</label>
          <select
            className="bl-select font-mono text-sm"
            value={renewMonths}
            onChange={(e) => setRenewMonths(Number(e.target.value))}
          >
            <option value={1}>+1 Month</option>
            <option value={3}>+3 Months (Quarterly)</option>
            <option value={6}>+6 Months (Semi-Annual)</option>
            <option value={12}>+12 Months (Annual Renewal)</option>
          </select>
        </div>
      </Modal>
    </div>
  );
}
