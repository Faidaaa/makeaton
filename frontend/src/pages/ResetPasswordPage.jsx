import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import PasswordInput from '../components/common/PasswordInput';
import PasswordChecklist, { isPasswordValid } from '../components/auth/PasswordChecklist';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import './AuthPages.css';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!password) {
      newErrors.password = 'New password is required.';
    } else if (!isPasswordValid(password)) {
      newErrors.password = 'Password does not meet the security policy criteria.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your new password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    // Emulate API call to POST /api/auth/reset-password
    setTimeout(() => {
      setLoading(false);
      setIsSuccess(true);
    }, 750);
  };

  return (
    <AuthLayout
      title="Set New Password"
      subtitle="Ensure your new credentials meet Brightloop's enterprise password policy."
      badge="CREDENTIAL ROTATION"
    >
      {isSuccess ? (
        <div className="recovery-success-box">
          <div className="success-icon-badge">
            <CheckCircle2 size={32} />
          </div>

          <div className="success-copy">
            <h2 className="success-title">Password Updated Successfully</h2>
            <p className="success-desc">
              Your password has been securely hashed and stored. All active sessions have been invalidated.
            </p>
          </div>

          <div className="recovery-actions">
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
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* New Password */}
          <PasswordInput
            label="New Password"
            id="reset-password"
            name="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
            }}
            placeholder="Enter your new password"
            required
            autoComplete="new-password"
            autoFocus
            error={errors.password}
          />

          {/* Confirm Password */}
          <PasswordInput
            label="Confirm New Password"
            id="reset-confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
            }}
            placeholder="Confirm your new password"
            required
            autoComplete="new-password"
            error={errors.confirmPassword}
          />

          {/* Live Password Checklist */}
          <PasswordChecklist
            password={password}
            confirmPassword={confirmPassword}
            showMatch={confirmPassword.length > 0}
          />

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            shape="pill"
            size="lg"
            fullWidth
            loading={loading}
            icon={<Lock size={16} />}
          >
            Update Account Password
          </Button>

          <div className="auth-switch-prompt">
            <Link to="/login" className="auth-switch-link">
              Cancel and return to Sign In
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
