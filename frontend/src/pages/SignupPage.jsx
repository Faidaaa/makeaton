import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, ArrowRight, CheckSquare, Square, Info } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import Input from '../components/common/Input';
import PasswordInput from '../components/common/PasswordInput';
import PasswordChecklist, { isPasswordValid } from '../components/auth/PasswordChecklist';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import './AuthPages.css';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState(null);

  const validate = () => {
    const newErrors = {};
    const normalizedEmail = formData.email.trim().toLowerCase();

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    }

    if (!normalizedEmail) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      newErrors.email = 'Please provide a valid email format.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (!isPasswordValid(formData.password)) {
      newErrors.password = 'Password must fulfill all security policy requirements.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the Terms of Service to create an account.';
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

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(), // Normalized
      role: 'customer', // Fixed to customer: Public signup never allows role escalation
    };

    setTimeout(() => {
      setLoading(false);
      setSubmitFeedback({
        type: 'success',
        title: 'Registration Form Validated',
        message: `Account payload ready for ${payload.email} (Role: ${payload.role}). Ready to connect to POST /api/auth/signup.`,
      });
    }, 800);
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Register as a Customer to manage subscriptions, billing, and team seats."
      badge="CUSTOMER REGISTRATION"
    >
      {/* Explicit Admin/Staff Security Notice */}
      <div className="security-notice-callout">
        <div className="notice-icon">
          <Info size={16} />
        </div>
        <div className="notice-text">
          <span className="notice-title label-mono">ROLE PROVISIONING POLICY</span>
          <p className="notice-desc">
            Public registration creates Customer accounts. Staff accounts are provisioned exclusively by your organization's Administrator, and Admin accounts are provisioned via secure infrastructure scripts.
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
        {/* Full Name */}
        <Input
          label="Full Name"
          id="signup-fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Jane Doe"
          required
          autoComplete="name"
          autoFocus
          error={errors.fullName}
          leftIcon={<User size={16} />}
        />

        {/* Email Address */}
        <Input
          label="Work Email Address"
          id="signup-email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="jane@company.com"
          required
          autoComplete="email"
          helperText="Will be normalized to lowercase before secure storage."
          error={errors.email}
          leftIcon={<Mail size={16} />}
        />

        {/* Password */}
        <PasswordInput
          label="Password"
          id="signup-password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a strong password"
          required
          autoComplete="new-password"
          error={errors.password}
        />

        {/* Confirm Password */}
        <PasswordInput
          label="Confirm Password"
          id="signup-confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Re-enter your password"
          required
          autoComplete="new-password"
          error={errors.confirmPassword}
        />

        {/* Live Password Requirement Checklist */}
        <PasswordChecklist
          password={formData.password}
          confirmPassword={formData.confirmPassword}
          showMatch={formData.confirmPassword.length > 0}
        />

        {/* Terms & Conditions Checkbox */}
        <div className="terms-checkbox-group">
          <label className="checkbox-label" htmlFor="agreeTerms">
            <input
              type="checkbox"
              id="agreeTerms"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              className="sr-only"
            />
            <span className="custom-checkbox" aria-hidden="true">
              {formData.agreeTerms ? <CheckSquare size={16} className="checked-icon" /> : <Square size={16} />}
            </span>
            <span className="checkbox-text">
              I agree to the <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a> and{' '}
              <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
            </span>
          </label>
          {errors.agreeTerms && (
            <div className="input-feedback feedback-error" role="alert">
              <span>{errors.agreeTerms}</span>
            </div>
          )}
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
          Create Customer Account
        </Button>

        {/* Link back to login */}
        <div className="auth-switch-prompt">
          <span>Already registered with Brightloop?</span>{' '}
          <Link to="/login" className="auth-switch-link">
            Sign in to existing account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
