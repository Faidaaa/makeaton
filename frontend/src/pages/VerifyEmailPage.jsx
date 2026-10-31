import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Mail, RefreshCw, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import './AuthPages.css';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get('status'); // 'success', 'expired', or null

  const [status, setStatus] = useState(urlStatus === 'success' ? 'verified' : 'pending');
  const [resending, setResending] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  const handleResendVerification = () => {
    setResending(true);
    setAlertInfo(null);

    setTimeout(() => {
      setResending(false);
      setAlertInfo({
        variant: 'success',
        title: 'New Verification Token Dispatched',
        message: 'A fresh cryptographic verification link has been sent to your registered email address via Nodemailer.',
      });
    }, 700);
  };

  const handleSimulateVerify = () => {
    setStatus('verified');
    setAlertInfo({
      variant: 'success',
      title: 'Identity Confirmed',
      message: 'Account flagged as isVerified: true in the database schema.',
    });
  };

  return (
    <AuthLayout
      title="Email Verification"
      subtitle="Brightloop requires email verification to safeguard subscription billing and team access."
      badge="IDENTITY VERIFICATION"
    >
      {alertInfo && (
        <Alert
          variant={alertInfo.variant}
          title={alertInfo.title}
          message={alertInfo.message}
          onClose={() => setAlertInfo(null)}
        />
      )}

      <div className="verification-card">
        {status === 'verified' ? (
          <div className="verify-state-content">
            <div className="verify-badge-icon badge-verified">
              <CheckCircle2 size={36} />
            </div>

            <div className="verify-status-badge label-mono status-verified">
              STATUS: EMAIL VERIFIED
            </div>

            <h2 className="verify-title">Account Ready for Access</h2>
            <p className="verify-desc">
              Your email address has been successfully validated. You now have full access to your role-based Brightloop workspace.
            </p>

            <div className="verification-metadata">
              <div className="meta-row">
                <span className="meta-key label-mono">AUTH PROTOCOL:</span>
                <span className="meta-val label-mono">HTTP-ONLY COOKIE</span>
              </div>
              <div className="meta-row">
                <span className="meta-key label-mono">ROLE ACCESS:</span>
                <span className="meta-val label-mono">CUSTOMER PORTAL</span>
              </div>
            </div>

            <Link to="/login" style={{ textDecoration: 'none', width: '100%' }}>
              <Button
                variant="primary"
                shape="pill"
                size="lg"
                fullWidth
                icon={<ArrowRight size={18} />}
              >
                Proceed to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <div className="verify-state-content">
            <div className="verify-badge-icon badge-pending">
              <Mail size={36} />
            </div>

            <div className="verify-status-badge label-mono status-pending">
              STATUS: AWAITING CONFIRMATION
            </div>

            <h2 className="verify-title">Check Your Inbox</h2>
            <p className="verify-desc">
              We’ve sent a confirmation link to your email. Click the link in the message to activate your Brightloop subscription workspace.
            </p>

            <div className="verify-notice-box">
              <ShieldCheck size={16} />
              <span>Unverified accounts cannot access billing or team management until confirmed.</span>
            </div>

            <div className="verify-actions">
              <Button
                variant="secondary"
                shape="pill"
                size="md"
                fullWidth
                loading={resending}
                onClick={handleResendVerification}
                icon={<RefreshCw size={15} />}
              >
                Resend Verification Email
              </Button>

              <button
                type="button"
                className="demo-simulate-link label-mono"
                onClick={handleSimulateVerify}
                title="Click to simulate successful token verification"
              >
                [DEMO: SIMULATE TOKEN VERIFIED]
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="auth-switch-prompt">
        <Link to="/login" className="auth-switch-link">
          Return to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
