import React, { useState, useEffect } from 'react';
import { 
  Repeat, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  PauseCircle, 
  PlayCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { api } from '../services/api';

export default function SubscriptionList({ onNavigate }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search && search.trim()) params.search = search.trim();
      if (statusFilter && statusFilter !== 'All') params.status = statusFilter;

      const res = await api.getSubscriptions(params);
      if (res && res.data) {
        setSubscriptions(res.data);
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSubscriptions();
  };

  const statuses = ['All', 'Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];

  return (
    <div className="bl-container">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-secondary font-bold">RECURRING CONTRACTS & LIFECYCLE</span>
          </div>
          <h1>Subscription Lifecycle Directory</h1>
          <p className="text-secondary text-sm">
            Strict lifecycle progression: <strong className="font-mono">Draft → Quotation → Confirmed → Active → Closed</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchSubscriptions}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => onNavigate('quotation-new')}
          >
            + New Proposal / Subscription
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="mb-6" style={{ padding: '0.85rem 1rem' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Status Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-secondary font-mono mr-1">LIFECYCLE STATUS:</span>
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
              placeholder="Search subscription # or customer..."
              className="bl-input text-xs"
              style={{ width: '250px', padding: '0.4rem 0.6rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" variant="outline" size="sm" icon={Search}>
              Search
            </Button>
          </form>
        </div>
      </Card>

      {/* Subscription Table */}
      <div className="bl-table-container">
        <table className="bl-table">
          <thead>
            <tr>
              <th>Subscription #</th>
              <th>Customer</th>
              <th>Plan</th>
              <th>Active Period</th>
              <th>Amount</th>
              <th>State Indicator</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading subscriptions...
                </td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                  No subscriptions match the selected criteria.
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => {
                const isExpiringSoon = 
                  sub.status === 'Active' && 
                  new Date(sub.expiryDate) - new Date() < 14 * 86400000;

                return (
                  <tr key={sub._id || sub.subscriptionNumber}>
                    <td>
                      <div className="font-mono font-bold" style={{ color: 'var(--accent-secondary)' }}>
                        {sub.subscriptionNumber}
                      </div>
                      {sub.quotationNumber && (
                        <div className="text-xs text-secondary font-mono">
                          Ref: {sub.quotationNumber}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="font-semibold">{sub.customer?.name}</div>
                      <div className="text-xs text-secondary font-mono">{sub.customer?.company || sub.customer?.email}</div>
                    </td>
                    <td>
                      <div className="font-semibold">{sub.plan?.name}</div>
                      <div className="text-xs text-secondary font-mono">{sub.plan?.billingFrequency}</div>
                    </td>
                    <td className="font-mono text-xs">
                      <div>
                        {new Date(sub.startDate).toLocaleDateString()} → {new Date(sub.expiryDate).toLocaleDateString()}
                      </div>
                      {isExpiringSoon && (
                        <span className="text-xs font-bold" style={{ color: '#d97706' }}>
                          ● Expiring within 14 days
                        </span>
                      )}
                    </td>
                    <td className="font-mono font-bold">
                      ${Number(sub.totalAmount || 0).toFixed(2)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Badge status={sub.status} />
                        {sub.isPaused && (
                          <span 
                            className="font-mono text-xs font-bold" 
                            style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #d97706', padding: '0.1rem 0.4rem' }}
                          >
                            PAUSED
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={ArrowRight}
                        onClick={() => onNavigate(`subscription-detail-${sub._id || sub.subscriptionNumber}`)}
                      >
                        Manage Lifecycle
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
