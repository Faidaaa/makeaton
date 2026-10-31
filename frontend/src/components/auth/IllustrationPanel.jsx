import React from 'react';
import { TrendingUp, RefreshCw, Layers, ShieldCheck, Zap } from 'lucide-react';
import './IllustrationPanel.css';

export default function IllustrationPanel() {
  return (
    <aside className="illustration-panel" aria-label="Brightloop Platform Overview">
      {/* Background architectural grid pattern */}
      <div className="panel-grid-pattern" aria-hidden="true" />

      <div className="panel-inner-container">
        {/* Top Product Heading & System Tag */}
        <header className="panel-header">
          <div className="panel-tag-row">
            <span className="panel-badge label-mono">
              <span className="panel-badge-dot" />
              ENGINE v2.4 // PRODUCTION
            </span>
            <span className="panel-badge-secondary label-mono">REVENUE OS</span>
          </div>

          <h2 className="panel-heading">
            Continuous Subscription Orchestration
          </h2>
          <p className="panel-subheading">
            Automate recurring billing, lifecycle triggers, and retention workflows across all customer tiers in real time.
          </p>
        </header>

        {/* Core Metric Cards Row */}
        <div className="panel-stats-grid">
          {/* Recurring Revenue Stat Card */}
          <div className="stat-card metric-card">
            <div className="metric-header">
              <span className="stat-label">MONTHLY RECURRING REVENUE</span>
              <span className="metric-trend label-mono">
                <TrendingUp size={12} />
                +18.4%
              </span>
            </div>
            <div className="stat-value">$142,850.00</div>
            <div className="metric-footer label-mono">
              <span>ARR $1.71M</span>
              <span className="metric-divider">•</span>
              <span>EXPANSION +12%</span>
            </div>
          </div>

          {/* Active Subscriptions Stat Card */}
          <div className="stat-card metric-card">
            <div className="metric-header">
              <span className="stat-label">ACTIVE SUBSCRIPTIONS</span>
              <span className="metric-pill label-mono">HEALTHY</span>
            </div>
            <div className="stat-value">3,842</div>
            <div className="metric-footer label-mono">
              <span>CHURN 0.72%</span>
              <span className="metric-divider">•</span>
              <span>NET 112%</span>
            </div>
          </div>
        </div>

        {/* Clean Vector Revenue Trend Graph */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title-group">
              <span className="chart-title label-mono">REVENUE TRAJECTORY (MRR)</span>
              <span className="chart-range label-mono">LAST 6 MONTHS</span>
            </div>
            <div className="chart-stat-badge label-mono">
              PEAK: $142.8K
            </div>
          </div>

          {/* Custom SVG Line Chart */}
          <div className="svg-chart-container">
            <svg
              viewBox="0 0 540 210"
              className="revenue-svg-chart"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Monthly recurring revenue growth chart from May to October"
            >
              <defs>
                {/* Area Gradient with subtle warm vermilion wash */}
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="30" y1="30" x2="520" y2="30" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="30" y1="80" x2="520" y2="80" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="30" y1="130" x2="520" y2="130" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="30" y1="175" x2="520" y2="175" stroke="var(--border-strong)" strokeWidth="1.5" />

              {/* Shaded Area */}
              <path
                d="M 45 155 Q 120 145, 190 120 T 330 85 T 440 55 T 505 40 L 505 175 L 45 175 Z"
                fill="url(#revenueGradient)"
              />

              {/* High-Contrast Trend Line */}
              <path
                d="M 45 155 Q 120 145, 190 120 T 330 85 T 440 55 T 505 40"
                fill="none"
                stroke="var(--accent-primary)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data Node Points */}
              <circle cx="45" cy="155" r="4.5" fill="var(--bg-surface)" stroke="var(--border-strong)" strokeWidth="2" />
              <circle cx="140" cy="138" r="4.5" fill="var(--bg-surface)" stroke="var(--border-strong)" strokeWidth="2" />
              <circle cx="230" cy="110" r="4.5" fill="var(--bg-surface)" stroke="var(--border-strong)" strokeWidth="2" />
              <circle cx="330" cy="85" r="4.5" fill="var(--bg-surface)" stroke="var(--border-strong)" strokeWidth="2" />
              <circle cx="420" cy="60" r="4.5" fill="var(--bg-surface)" stroke="var(--border-strong)" strokeWidth="2" />
              <circle cx="505" cy="40" r="6" fill="var(--accent-primary)" stroke="var(--border-strong)" strokeWidth="2" />

              {/* Callout Marker Tooltip at Peak */}
              <g className="chart-marker-tooltip">
                <rect x="425" y="5" width="95" height="26" rx="4" fill="var(--bg-surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
                <text x="472" y="22" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fontWeight="700" fill="var(--text-primary)">
                  OCT: $142.8K
                </text>
              </g>

              {/* X-Axis Month Labels */}
              <text x="45" y="196" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--text-secondary)">MAY</text>
              <text x="140" y="196" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--text-secondary)">JUN</text>
              <text x="230" y="196" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--text-secondary)">JUL</text>
              <text x="330" y="196" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--text-secondary)">AUG</text>
              <text x="420" y="196" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--text-secondary)">SEP</text>
              <text x="505" y="196" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fontWeight="700" fill="var(--accent-primary)">OCT</text>
            </svg>
          </div>
        </div>

        {/* Realtime Workflow & Lifecycle Activity Feed */}
        <div className="activity-card">
          <div className="activity-header">
            <span className="activity-title label-mono">SUBSCRIPTION LIFECYCLE DISPATCH</span>
            <span className="activity-live-pill label-mono">
              <span className="live-pulse" /> LIVE
            </span>
          </div>

          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-badge badge-renewal">
                <RefreshCw size={12} />
              </div>
              <div className="activity-info">
                <div className="activity-main">
                  <span className="activity-entity">Acme Cloud</span>
                  <span className="activity-desc">Enterprise Annual auto-renewed</span>
                  <span className="activity-amount label-mono">+$14,400.00</span>
                </div>
                <div className="activity-meta label-mono">STATUS: 200 OK • STRIPE DISPATCHED</div>
              </div>
              <span className="activity-time label-mono">02m ago</span>
            </div>

            <div className="activity-item">
              <div className="activity-badge badge-upgrade">
                <Zap size={12} />
              </div>
              <div className="activity-info">
                <div className="activity-main">
                  <span className="activity-entity">DevSync Labs</span>
                  <span className="activity-desc">Upgraded from Starter to Scale</span>
                  <span className="activity-amount label-mono">+$299.00/mo</span>
                </div>
                <div className="activity-meta label-mono">+6 SEATS PROVISIONED</div>
              </div>
              <span className="activity-time label-mono">14m ago</span>
            </div>

            <div className="activity-item">
              <div className="activity-badge badge-audit">
                <ShieldCheck size={12} />
              </div>
              <div className="activity-info">
                <div className="activity-main">
                  <span className="activity-entity">Billing Bot</span>
                  <span className="activity-desc">Batch renewal pre-check passed</span>
                  <span className="activity-amount label-mono">318 QUEUED</span>
                </div>
                <div className="activity-meta label-mono">RECOVERY RATE: 99.4%</div>
              </div>
              <span className="activity-time label-mono">48m ago</span>
            </div>
          </div>
        </div>

        {/* Bottom Platform Guarantee Banner */}
        <div className="platform-footer-banner">
          <div className="banner-icon">
            <Layers size={18} />
          </div>
          <div className="banner-text">
            <div className="banner-title label-mono">ENTERPRISE-GRADE RBAC & TOKEN SECURITY</div>
            <p className="banner-desc">
              Zero-exposure HTTP-only session tokens with strict role separation for Admins, Staff, and Customers.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
