import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Repeat, 
  FileText, 
  AlertCircle, 
  Search, 
  ArrowRight, 
  Plus, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { api } from '../services/api';

export default function StaffWorkspace({ onNavigate }) {
  const [metrics, setMetrics] = useState({
    activeSubscriptions: 0,
    totalSubscriptions: 0,
    pausedSubscriptions: 0,
    pendingQuotations: 0,
    totalQuotations: 0,
    estimatedRevenue: 0,
    recentQuotations: [],
    recentSubscriptions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'quotes' | 'subscriptions'

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getStaffOverview();
      if (response && response.data) {
        setMetrics(response.data);
      }
    } catch (err) {
      console.error('Failed to load staff overview:', err);
      setError('Could not connect to API server. Ensure the backend server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Filtered lists based on search
  const filteredQuotes = (metrics.recentQuotations || []).filter((q) => {
    if (!searchQuery) return true;
    const matchNumber = q.quotationNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCustomer = q.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchNumber || matchCustomer;
  });

  const filteredSubs = (metrics.recentSubscriptions || []).filter((s) => {
    if (!searchQuery) return true;
    const matchNumber = s.subscriptionNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCustomer = s.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchNumber || matchCustomer;
  });

  return (
    <div className="bl-container">
      {/* Workspace Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-secondary font-bold" style={{ letterSpacing: '0.06em' }}>
              INTERNAL STAFF WORKSPACE
            </span>
          </div>
          <h1>Staff Overview Dashboard</h1>
          <p className="text-secondary text-sm">
            Monitor real-time subscription pipelines, quotation conversions, and customer accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchOverview}
            disabled={loading}
          >
            Refresh Data
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => onNavigate('quotation-new')}
          >
            Create New Quotation
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div 
          className="bl-card mb-6" 
          style={{ 
            backgroundColor: '#fef2f2', 
            borderColor: '#dc2626', 
            boxShadow: '3px 3px 0px #dc2626' 
          }}
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={20} color="#dc2626" />
            <div>
              <p className="font-bold text-sm" style={{ color: '#991b1b' }}>Backend Server Offline</p>
              <p className="text-xs" style={{ color: '#7f1d1d' }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Metrics Cards Grid */}
      <div className="bl-grid-metrics">
        {/* Metric 1: Active Subscriptions */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-secondary font-mono">ACTIVE SUBSCRIPTIONS</span>
              <Repeat size={18} color="var(--accent-secondary)" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono" style={{ fontSize: '2rem', fontWeight: 800 }}>
                {metrics.activeSubscriptions}
              </span>
              <span className="text-xs text-secondary">of {metrics.totalSubscriptions} total</span>
            </div>
          </div>
          <div className="mt-3 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <span className="font-mono text-xs" style={{ color: '#059669', fontWeight: 600 }}>
              ● {metrics.activeSubscriptions} Generating Revenue
            </span>
            {metrics.pausedSubscriptions > 0 && (
              <span className="font-mono text-xs text-secondary" style={{ marginLeft: '0.75rem' }}>
                ({metrics.pausedSubscriptions} Paused)
              </span>
            )}
          </div>
        </Card>

        {/* Metric 2: Pending Quotations */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-secondary font-mono">OPEN QUOTATIONS</span>
              <FileText size={18} color="var(--accent-primary)" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono" style={{ fontSize: '2rem', fontWeight: 800 }}>
                {metrics.pendingQuotations}
              </span>
              <span className="text-xs text-secondary">awaiting action</span>
            </div>
          </div>
          <div className="mt-3 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <span className="font-mono text-xs" style={{ color: '#d97706', fontWeight: 600 }}>
              ● {metrics.totalQuotations} Total Lifetime Quotes
            </span>
          </div>
        </Card>

        {/* Metric 3: Active Contract Value */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-secondary font-mono">ACTIVE PIPELINE VALUE</span>
              <DollarSign size={18} color="#059669" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono" style={{ fontSize: '2rem', fontWeight: 800 }}>
                ${Number(metrics.estimatedRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <span className="font-mono text-xs text-secondary">
              Combined active subscriptions sum
            </span>
          </div>
        </Card>

        {/* Metric 4: Lifecycle Conversion Health */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-secondary font-mono">LIFECYCLE STATUS</span>
              <TrendingUp size={18} color="var(--accent-secondary)" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono" style={{ fontSize: '2rem', fontWeight: 800 }}>
                100%
              </span>
              <span className="text-xs text-secondary">compliance</span>
            </div>
          </div>
          <div className="mt-3 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <span className="font-mono text-xs" style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>
              Draft → Quote → Confirm → Active
            </span>
          </div>
        </Card>
      </div>

      {/* Global Filter & Search Bar */}
      <div className="bl-card mb-6" style={{ padding: '0.85rem 1rem' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2" style={{ flex: '1 1 300px' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search by quote/subscription ID, customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bl-input"
              style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-strong)' }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-secondary font-mono">VIEW:</span>
            <button
              onClick={() => setFilterType('all')}
              className={`bl-btn bl-btn-sm ${filterType === 'all' ? 'bl-btn-primary' : 'bl-btn-outline'}`}
            >
              All Records
            </button>
            <button
              onClick={() => setFilterType('quotes')}
              className={`bl-btn bl-btn-sm ${filterType === 'quotes' ? 'bl-btn-primary' : 'bl-btn-outline'}`}
            >
              Quotations Only
            </button>
            <button
              onClick={() => setFilterType('subscriptions')}
              className={`bl-btn bl-btn-sm ${filterType === 'subscriptions' ? 'bl-btn-primary' : 'bl-btn-outline'}`}
            >
              Subscriptions Only
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Recent Quotations Table */}
      {(filterType === 'all' || filterType === 'quotes') && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText size={18} color="var(--accent-primary)" />
              <h2 className="font-bold">Recent Quotations</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={ArrowRight}
              onClick={() => onNavigate('quotations')}
            >
              Manage All Quotations
            </Button>
          </div>

          <div className="bl-table-container">
            <table className="bl-table">
              <thead>
                <tr>
                  <th>Quotation #</th>
                  <th>Customer</th>
                  <th>Plan Selected</th>
                  <th>Valid Until</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No quotations match your current filter.
                    </td>
                  </tr>
                ) : (
                  filteredQuotes.map((q) => (
                    <tr key={q._id || q.quotationNumber}>
                      <td className="font-mono font-bold" style={{ color: 'var(--accent-secondary)' }}>
                        {q.quotationNumber}
                      </td>
                      <td>
                        <div className="font-semibold">{q.customer?.name}</div>
                        <div className="text-xs text-secondary font-mono">{q.customer?.email}</div>
                      </td>
                      <td>
                        <span className="font-semibold">{q.plan?.name}</span>
                        <span className="text-xs text-secondary ml-1 font-mono">({q.plan?.billingFrequency})</span>
                      </td>
                      <td className="font-mono text-xs">
                        {new Date(q.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="font-mono font-bold">
                        ${Number(q.totalAmount || 0).toFixed(2)}
                      </td>
                      <td>
                        <Badge status={q.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onNavigate(`quotation-detail-${q._id || q.quotationNumber}`)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 2: Active & Managed Subscriptions Table */}
      {(filterType === 'all' || filterType === 'subscriptions') && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Repeat size={18} color="var(--accent-secondary)" />
              <h2 className="font-bold">Managed Subscriptions</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={ArrowRight}
              onClick={() => onNavigate('subscriptions')}
            >
              Manage Subscriptions Lifecycle
            </Button>
          </div>

          <div className="bl-table-container">
            <table className="bl-table">
              <thead>
                <tr>
                  <th>Subscription #</th>
                  <th>Customer</th>
                  <th>Plan Tier</th>
                  <th>Current Period</th>
                  <th>Amount</th>
                  <th>Lifecycle Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubs.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No subscriptions found.
                    </td>
                  </tr>
                ) : (
                  filteredSubs.map((s) => (
                    <tr key={s._id || s.subscriptionNumber}>
                      <td className="font-mono font-bold">
                        {s.subscriptionNumber}
                        {s.isPaused && (
                          <span 
                            className="font-mono text-xs font-bold ml-2" 
                            style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.1rem 0.35rem', border: '1px solid #d97706' }}
                          >
                            PAUSED
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="font-semibold">{s.customer?.name}</div>
                        <div className="text-xs text-secondary font-mono">{s.customer?.company || s.customer?.email}</div>
                      </td>
                      <td>
                        <span className="font-semibold">{s.plan?.name}</span>
                      </td>
                      <td className="font-mono text-xs">
                        {new Date(s.startDate).toLocaleDateString()} → {new Date(s.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="font-mono font-bold">
                        ${Number(s.totalAmount || 0).toFixed(2)}
                      </td>
                      <td>
                        <Badge status={s.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onNavigate(`subscription-detail-${s._id || s.subscriptionNumber}`)}
                        >
                          Lifecycle View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
