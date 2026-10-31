import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import Input from '../components/common/Input';
import PasswordInput from '../components/common/PasswordInput';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import './AuthPages.css';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState(null);

  const validate = () => {
    const newErrors = {};
    const normalizedEmail = formData.email.trim().toLowerCase();

    if (!normalizedEmail) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitFeedback(null);

    if (!validate()) {
      return;
    }

    setLoading(true);

    // Frontend validation & dispatch preparation (Ready for backend API integration)
    const normalizedEmail = formData.email.trim().toLowerCase();

    setTimeout(() => {
      setLoading(false);
      setSubmitFeedback({
        type: 'info',
        title: 'Validation Verified',
        message: `Credentials for ${normalizedEmail} prepared with HTTP-only cookie configuration. Ready to connect to POST /api/auth/login.`,
      });
    }, 700);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Brightloop subscription management workspace."
      badge="UNIVERSAL GATEWAY"
    >
      {/* Informational Callout explaining Universal Role Redirection */}
      <div className="role-gateway-callout">
        <div className="gateway-icon">
          <ShieldCheck size={16} />
        </div>
        <div className="gateway-text">
          <span className="gateway-title label-mono">UNIFIED ROLE AUTHENTICATION</span>
          <p className="gateway-desc">
            Admins, Staff, and Customers log in here. The backend resolves your role and routes you to your specific dashboard.
          </p>
        </div>
      </div>

      {submitFeedback && (
        <Alert
          variant={submitFeedback.type}
          title={submitFeedback.title}
          message={submitFeedback.message}
          onClose={() => setSubmitFeedback(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Email Field */}
        <Input
          label="Email Address"
          id="login-email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="name@company.com"
          required
          autoComplete="email"
          autoFocus
          error={errors.email}
          leftIcon={<Mail size={16} />}
        />

        {/* Password Field */}
        <PasswordInput
          label="Password"
          id="login-password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your account password"
          required
          autoComplete="current-password"
          error={errors.password}
        />

        {/* Remember Me & Forgot Password Row */}
        <div className="form-action-row">
          <label className="checkbox-label" htmlFor="rememberMe">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="sr-only"
            />
            <span className="custom-checkbox" aria-hidden="true">
              {formData.rememberMe ? <CheckSquare size={16} className="checked-icon" /> : <Square size={16} />}
            </span>
            <span className="checkbox-text">Remember this session</span>
          </label>

          <Link to="/forgot-password" className="forgot-password-link">
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          shape="pill"
          size="lg"
          fullWidth
          loading={loading}
          icon={<ArrowRight size={18} />}
        >
          Sign in to Brightloop
        </Button>

        {/* Switch to Signup */}
        <div className="auth-switch-prompt">
          <span>Need a new subscription account?</span>{' '}
          <Link to="/signup" className="auth-switch-link">
            Sign up as Customer
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
