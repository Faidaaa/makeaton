import React from 'react';
import { LayoutDashboard, FileText, Repeat, UserCheck } from 'lucide-react';

/**
 * Navbar Component
 * Navigation header for Brightloop Staff Workspace.
 */
export default function Navbar({ activeTab, onTabChange }) {
  const navItems = [
    { id: 'workspace', label: 'Staff Workspace', icon: LayoutDashboard },
    { id: 'quotations', label: 'Quotations', icon: FileText },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
  ];

  return (
    <header className="bl-header">
      <div className="bl-container" style={{ padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div style={{
            backgroundColor: 'var(--accent-primary)',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.1rem',
            padding: '0.25rem 0.65rem',
            border: '2px solid var(--border-strong)',
            boxShadow: '2px 2px 0px #000000',
            fontFamily: 'var(--font-mono)'
          }}>
            BL
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>BRIGHTLOOP</span>
            <span className="font-mono text-xs text-secondary" style={{ marginLeft: '0.5rem', border: '1px solid var(--border-strong)', padding: '0.1rem 0.4rem', backgroundColor: 'var(--bg-subtle)' }}>
              STAFF PORTAL
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="bl-btn"
                style={{
                  backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                  border: isActive ? '2px solid var(--border-strong)' : '2px solid transparent',
                  boxShadow: isActive ? '2px 2px 0px #000000' : 'none',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem'
                }}
              >
                <Icon size={16} color={isActive ? 'var(--accent-primary)' : 'currentColor'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Staff User Profile Indicator */}
        <div className="flex items-center gap-2" style={{
          border: '2px solid var(--border-strong)',
          padding: '0.3rem 0.65rem',
          backgroundColor: 'var(--bg-subtle)',
          boxShadow: '1.5px 1.5px 0px #000000'
        }}>
          <UserCheck size={16} color="var(--accent-secondary)" />
          <div className="flex flex-col">
            <span className="font-bold text-xs" style={{ lineHeight: 1.1 }}>Vishnu (Staff)</span>
            <span className="font-mono text-xs text-secondary" style={{ fontSize: '0.68rem' }}>STAFF · ACTIVE</span>
          </div>
        </div>
      </div>
    </header>
  );
}
