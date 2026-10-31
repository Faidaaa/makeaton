import React from 'react';
import { TrendingUp, Users, ShieldCheck, Sparkles } from 'lucide-react';
import Logo from '../common/Logo';
import './AuthIllustration.css';

/**
 * Compact, zero-scroll decorative left panel per design.md and Task 3 specifications.
 * All indicators are explicitly marked as decorative sample preview data.
 */
export default function AuthIllustration() {
  return (
    <aside className="auth-illustration-panel" aria-label="Brightloop Overview">
      {/* Background architectural dot grid */}
      <div className="illustration-grid-pattern" aria-hidden="true" />

      <div className="illustration-content">
        {/* Top Branding */}
        <header className="illustration-brand">
          <Logo size="md" showSubtitle={false} to="/login" />
          <span className="sample-badge label-mono">
            <span className="sample-badge-dot" />
            SYSTEM PREVIEW
          </span>
        </header>

        {/* Headline & Value Proposition */}
        <div className="illustration-headline-group">
          <h2 className="illustration-title">
            Subscription Operations &amp; Lifecycle Automation
          </h2>
          <p className="illustration-desc">
            Unified recurring billing, automated quotes, and strict role-based access for Admins, Staff, and Customers.
          </p>
        </div>

        {/* Compact Decorative Analytics Card */}
        <div className="sample-analytics-card">
          <div className="analytics-card-header">
            <span className="card-tag label-mono">RECURRING REVENUE (SAMPLE)</span>
            <span className="card-trend label-mono">
              <TrendingUp size={12} />
              +18.4%
            </span>
          </div>

          {/* Mini Stat Blocks */}
          <div className="analytics-stats-row">
            <div className="mini-stat">
              <span className="mini-stat-value">$142,850</span>
              <span className="mini-stat-label label-mono">SAMPLE MRR</span>
            </div>
            <div className="mini-stat-divider" aria-hidden="true" />
            <div className="mini-stat">
              <span className="mini-stat-value">3,842</span>
              <span className="mini-stat-label label-mono">ACTIVE SUBS</span>
            </div>
            <div className="mini-stat-divider" aria-hidden="true" />
            <div className="mini-stat">
              <span className="mini-stat-value">99.2%</span>
              <span className="mini-stat-label label-mono">COLLECTION</span>
            </div>
          </div>

          {/* Compact Vector Revenue Sparkline */}
          <div className="sample-svg-container">
            <svg
              viewBox="0 0 340 90"
              className="sample-chart-svg"
              preserveAspectRatio="none"
              role="img"
              aria-label="Sample recurring revenue growth sparkline"
            >
              <defs>
                <linearGradient id="sampleRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid guide */}
              <line x1="10" y1="20" x2="330" y2="20" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="10" y1="50" x2="330" y2="50" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="10" y1="75" x2="330" y2="75" stroke="var(--border-strong)" strokeWidth="1" />

              {/* Shaded Area */}
              <path
                d="M 15 65 Q 60 60, 100 50 T 180 38 T 260 25 T 325 15 L 325 75 L 15 75 Z"
                fill="url(#sampleRevGrad)"
              />

              {/* High-contrast curve */}
              <path
                d="M 15 65 Q 60 60, 100 50 T 180 38 T 260 25 T 325 15"
                fill="none"
                stroke="var(--accent-primary)"
                strokeWidth="2.75"
                strokeLinecap="round"
              />

              {/* Data points */}
              <circle cx="15" cy="65" r="3.5" fill="var(--bg-surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
              <circle cx="100" cy="50" r="3.5" fill="var(--bg-surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
              <circle cx="180" cy="38" r="3.5" fill="var(--bg-surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
              <circle cx="260" cy="25" r="3.5" fill="var(--bg-surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
              <circle cx="325" cy="15" r="4.5" fill="var(--accent-primary)" stroke="var(--border-strong)" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="sample-chart-footer label-mono">
            <span>Q1</span>
            <span>Q2</span>
            <span>Q3</span>
            <span>Q4 (TARGET REACHED)</span>
          </div>
        </div>

        {/* Footer Feature Badges */}
        <footer className="illustration-footer">
          <div className="security-pill label-mono">
            <ShieldCheck size={13} />
            <span>ROLE-BASED ROUTING (ADMIN • STAFF • CUSTOMER)</span>
          </div>
          <div className="copyright-notice label-mono">
            BRIGHTLOOP © {new Date().getFullYear()} // ZERO-TRUST ARCHITECTURE
          </div>
        </footer>
      </div>
    </aside>
  );
}

