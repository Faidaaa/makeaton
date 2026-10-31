import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import './AuthPages.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentToEmail, setSentToEmail] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Please enter your registered email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);

    // Emulate API call to POST /api/auth/forgot-password
    setTimeout(() => {
      setLoading(false);
      setSentToEmail(normalizedEmail);
    }, 700);
  };

  const handleResend = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter the email associated with your Brightloop account to receive a secure recovery link."
      badge="PASSWORD RECOVERY"
    >
      {sentToEmail ? (
        <div className="recovery-success-box">
          <div className="success-icon-badge">
            <CheckCircle2 size={32} />
          </div>

          <div className="success-copy">
            <h2 className="success-title">Recovery Link Dispatched</h2>
            <p className="success-desc">
              If an account exists for <strong className="email-highlight">{sentToEmail}</strong>, we have sent a secure, time-sensitive reset link.
            </p>
          </div>

          <div className="expiration-callout">
            <Clock size={16} />
            <span className="label-mono">LINK EXPIRES IN 60 MINUTES</span>
          </div>

          <div className="recovery-actions">
            <Button
              variant="secondary"
              shape="pill"
              size="md"
              fullWidth
              loading={loading}
              onClick={handleResend}
            >
              Resend Recovery Link
            </Button>

            <Link to="/login" className="back-to-login-btn">
              <ArrowLeft size={16} />
              <span>Return to Sign In</span>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <Input
            label="Registered Account Email"
            id="forgot-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            placeholder="name@company.com"
            required
            autoComplete="email"
            autoFocus
            error={error}
            helperText="We will send an expiring cryptographically signed reset token via Nodemailer."
            leftIcon={<Mail size={16} />}
          />

          <Button
            type="submit"
            variant="primary"
            shape="pill"
            size="lg"
            fullWidth
            loading={loading}
            icon={<ArrowRight size={18} />}
          >
            Send Recovery Link
          </Button>

          <div className="auth-switch-prompt">
            <Link to="/login" className="back-link">
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
