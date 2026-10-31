import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <AuthLayout
      title="404 — Page Not Found"
      subtitle="The authentication endpoint or route you requested does not exist."
      badge="HTTP 404"
    >
      <div className="recovery-success-box">
        <div className="success-icon-badge" style={{ backgroundColor: 'var(--bg-subtle)' }}>
          <Compass size={32} />
        </div>

        <div className="success-copy">
          <h2 className="success-title">Route Unrecognized</h2>
          <p className="success-desc">
            Please verify the URL or return to the central Brightloop authentication portal.
          </p>
        </div>

        <div className="recovery-actions">
          <Link to="/login" style={{ textDecoration: 'none', width: '100%' }}>
            <Button
              variant="primary"
              shape="pill"
              size="lg"
              fullWidth
              icon={<ArrowLeft size={18} />}
            >
              Return to Login Portal
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
