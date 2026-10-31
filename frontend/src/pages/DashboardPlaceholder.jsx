import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut } from 'lucide-react';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

/**
 * Clean role-based workspace landing page.
 * Uses useAuth() from AuthContext for state and session management.
 */
export default function DashboardPlaceholder({ expectedRole = 'customer' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  if (!user) {
    return null; // ProtectedRoute will handle redirection to /login
  }

  return (
    <div className="auth-viewport-root" style={{ alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="compact-success-card" style={{ maxWidth: 500, gap: '1.25rem' }}>
        <Logo size="md" showSubtitle={false} to={null} />

        <div className="compact-success-icon" style={{ backgroundColor: 'var(--accent-light)', borderColor: 'var(--accent-primary)' }}>
          <ShieldCheck size={28} style={{ color: 'var(--accent-primary)' }} />
        </div>

        <div className="compact-success-body">
          <span className="label-mono" style={{ color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 700 }}>
            ROLE GATEWAY: {user.role?.toUpperCase()} PORTAL
          </span>
          <h1 className="compact-success-title" style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>
            {user.role === 'admin' && 'Admin Console'}
            {user.role === 'staff' && 'Staff Workspace'}
            {user.role === 'customer' && 'Customer Portal'}
          </h1>
          <p className="compact-success-desc">
            Authenticated as <strong>{user.email}</strong>. Session protected via HTTP-only JWT cookie.
          </p>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Button
            variant="secondary"
            shape="pill"
            size="md"
            fullWidth
            onClick={handleLogout}
            icon={<LogOut size={16} />}
          >
            Sign Out
          </Button>
        </div>

        <div className="label-mono" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
          BRIGHTLOOP RBAC SESSION ACTIVE // USER ID: {user.id || user._id}
        </div>
      </div>
    </div>
  );
}
