import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, ShieldCheck, CheckSquare, Square, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import Logo from '../components/common/Logo';
import Input from '../components/common/Input';
import PasswordInput from '../components/common/PasswordInput';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import AuthIllustration from '../components/auth/AuthIllustration';
import { validatePasswordRules, isPasswordValid } from '../components/auth/PasswordChecklist';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import './AuthPage.css';

/**
 * Brightloop Single-Screen Zero-Scroll Authentication Interface.
 * Strictly adheres to design.md and all project specifications.
 * Supports universal and dedicated role logins (Customer, Staff, Admin).
 */
export default function AuthPage({ initialMode = 'login', initialRole }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, login } = useAuth();

  // Resolve current active mode from route path or prop
  const resolveMode = () => {
    const path = location.pathname;
    if (path.includes('signup')) return 'signup';
    if (path.includes('forgot')) return 'forgot';
    if (path.includes('reset')) return 'reset';
    return initialMode || 'login';
  };

  // Resolve active portal role (customer | staff | admin)
  const resolveRole = () => {
    if (initialRole) return initialRole;
    const path = location.pathname;
    if (path.includes('/admin/login')) return 'admin';
    if (path.includes('/staff/login')) return 'staff';
    return 'customer';
  };

  const [mode, setMode] = useState(resolveMode);
  const [activeRole, setActiveRole] = useState(resolveRole);

  // If already authenticated and visiting auth pages, navigate to respective portal
  useEffect(() => {
    if (user && mode !== 'reset') {
      const target = user.role === 'admin' ? '/admin' : user.role === 'staff' ? '/staff' : '/customer';
      navigate(target, { replace: true });
    }
  }, [user, mode, navigate]);

  useEffect(() => {
    setMode(resolveMode());
    setActiveRole(resolveRole());

    if (resolveMode() === 'reset' && !searchParams.get('token')) {
      setFeedback({
        type: 'warning',
        title: 'Missing Reset Token',
        message: 'No reset token was detected in the URL. Please use the link sent to your email or enter your credentials below.',
      });
    }
  }, [location.pathname, initialRole, searchParams]);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [forgotSentEmail, setForgotSentEmail] = useState(null);

  // Switch dedicated role portals
  const handleRoleSwitch = (targetRole) => {
    setActiveRole(targetRole);
    setErrors({});
    setFeedback(null);
    if (targetRole === 'admin') navigate('/admin/login');
    else if (targetRole === 'staff') navigate('/staff/login');
    else navigate('/customer/login');
  };

  // Switch tabs/modes cleanly without layout shift or page refresh
  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setErrors({});
    setFeedback(null);
    setResetSuccess(false);
    setForgotSentEmail(null);

    if (newMode === 'login') {
      if (activeRole === 'admin') navigate('/admin/login', { replace: true });
      else if (activeRole === 'staff') navigate('/staff/login', { replace: true });
      else navigate('/customer/login', { replace: true });
    }
    else if (newMode === 'signup') navigate('/signup', { replace: true });
    else if (newMode === 'forgot') navigate('/forgot-password', { replace: true });
    else if (newMode === 'reset') navigate('/reset-password', { replace: true });
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

  // Validation
  const validate = () => {
    const newErrors = {};
    const normalizedEmail = formData.email.trim().toLowerCase();

    if (mode === 'login' || mode === 'signup' || mode === 'forgot') {
      if (!normalizedEmail) {
        newErrors.email = 'Email address is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        newErrors.email = 'Please enter a valid email format.';
      }
    }

    if (mode === 'login' || mode === 'signup' || mode === 'reset') {
      if (!formData.password) {
        newErrors.password = 'Password is required.';
      }
    }

    if (mode === 'signup' || mode === 'reset') {
      if (!isPasswordValid(formData.password)) {
        newErrors.password = 'Must be >8 characters with uppercase, lowercase, & special character.';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirm your password.';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!validate()) {
      return;
    }

    setLoading(true);

    // Live customer registration connected to backend MongoDB API
    if (mode === 'signup') {
      try {
        const data = await authService.register(
          formData.email.trim().toLowerCase(),
          formData.password
        );

        setFeedback({
          type: 'success',
          title: 'Account Created',
          message: `Customer account registered for ${data.user?.email || formData.email}. Saved to MongoDB Atlas. You may now sign in.`,
        });

        // Clear password fields on success
        setFormData((prev) => ({
          ...prev,
          password: '',
          confirmPassword: '',
        }));
      } catch (err) {
        setFeedback({
          type: 'error',
          title: 'Registration Failed',
          message: err.message || 'Could not connect to server. Ensure the backend is running on port 5000.',
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Live user login connected to backend MongoDB API
    if (mode === 'login') {
      try {
        const data = await login(
          formData.email.trim().toLowerCase(),
          formData.password
        );

        const role = data.user?.role || 'customer';

        if (activeRole && activeRole !== role) {
          setFeedback({
            type: 'success',
            title: 'Login Successful',
            message: `Account is assigned the ${role.toUpperCase()} role. Redirecting to your workspace...`,
          });
        } else {
          setFeedback({
            type: 'success',
            title: 'Login Successful',
            message: `Authenticated as ${role.toUpperCase()}. Redirecting to your workspace...`,
          });
        }

        // Role-based redirection
        setTimeout(() => {
          if (role === 'admin') {
            navigate('/admin');
          } else if (role === 'staff') {
            navigate('/staff');
          } else {
            navigate('/customer');
          }
        }, 900);
      } catch (err) {
        setFeedback({
          type: 'error',
          title: 'Authentication Failed',
          message: err.message || 'Invalid email or password.',
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Live password recovery request connected to backend
    if (mode === 'forgot') {
      try {
        await authService.forgotPassword(formData.email.trim().toLowerCase());
        setForgotSentEmail(formData.email.trim().toLowerCase());
      } catch (err) {
        setFeedback({
          type: 'error',
          title: 'Request Failed',
          message: err.message || 'Could not send reset link. Please try again.',
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Live password reset connected to backend
    if (mode === 'reset') {
      const resetToken = searchParams.get('token');
      if (!resetToken) {
        setFeedback({
          type: 'error',
          title: 'Missing Reset Token',
          message: 'No reset token was found in the URL. Please request a new recovery link.',
        });
        setLoading(false);
        return;
      }

      try {
        await authService.resetPassword(resetToken, formData.password);
        setResetSuccess(true);
      } catch (err) {
        setFeedback({
          type: 'error',
          title: 'Reset Failed',
          message: err.message || 'Unable to update password. Token may be expired or already used.',
        });
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  // Live password checklist rule computations
  const passwordRules = validatePasswordRules(formData.password);

  return (
    <div className="auth-viewport-root">
      {/* Split-Screen Grid Layout */}
      <div className="auth-viewport-grid">
        {/* Left Side: Branded Decorative Illustration Panel (Desktop only) */}
        <div className="auth-grid-left">
          <AuthIllustration />
        </div>

        {/* Right Side: High-legibility Auth Form Container */}
        <main className="auth-grid-right" role="main">
          <div className="auth-card-container">
            {/* Mobile Branding (Displayed only when left panel is hidden on smaller screens) */}
            <div className="auth-mobile-header">
              <Logo size="sm" showSubtitle={false} to="/login" />
              <span className="auth-mobile-badge label-mono">
                {activeRole ? `${activeRole.toUpperCase()} GATEWAY` : 'AUTH GATEWAY'}
              </span>
            </div>

            {/* Dedicated Role Tabs Switch (Customer / Staff / Admin) */}
            {mode === 'login' && (
              <div className="role-switch-wrapper" role="tablist" aria-label="Portal Selection">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeRole === 'customer'}
                  className={`role-tab label-mono ${activeRole === 'customer' ? 'role-tab-active' : ''}`}
                  onClick={() => handleRoleSwitch('customer')}
                >
                  CUSTOMER
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeRole === 'staff'}
                  className={`role-tab label-mono ${activeRole === 'staff' ? 'role-tab-active' : ''}`}
                  onClick={() => handleRoleSwitch('staff')}
                >
                  STAFF
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeRole === 'admin'}
                  className={`role-tab label-mono ${activeRole === 'admin' ? 'role-tab-active' : ''}`}
                  onClick={() => handleRoleSwitch('admin')}
                >
                  ADMIN
                </button>
              </div>
            )}

            {/* Segmented Switch for Login / Signup (Only shown when in login/signup mode) */}
            {(mode === 'login' || mode === 'signup') && (
              <div className="segmented-switch-wrapper" role="tablist" aria-label="Authentication Options">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  className={`segmented-tab label-mono ${mode === 'login' ? 'tab-active' : ''}`}
                  onClick={() => handleModeSwitch('login')}
                >
                  SIGN IN
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signup'}
                  className={`segmented-tab label-mono ${mode === 'signup' ? 'tab-active' : ''}`}
                  onClick={() => handleModeSwitch('signup')}
                >
                  CREATE ACCOUNT
                </button>
              </div>
            )}

            {/* Form Heading Section */}
            <header className="auth-form-header">
              <h1 className="auth-form-title">
                {mode === 'login' && (
                  activeRole === 'admin' ? 'Admin Console Sign In' :
                  activeRole === 'staff' ? 'Staff Workspace Sign In' :
                  'Customer Portal Sign In'
                )}
                {mode === 'signup' && 'Create Customer Account'}
                {mode === 'forgot' && 'Reset Password'}
                {mode === 'reset' && 'Set New Password'}
              </h1>
              <p className="auth-form-subtitle">
                {mode === 'login' && (
                  activeRole === 'admin' ? 'Sign in with administrator credentials to manage platform, catalogs, and staff.' :
                  activeRole === 'staff' ? 'Sign in to manage quotations, customer accounts, and subscription lifecycles.' :
                  'Sign in to manage your active subscriptions, invoices, and payments.'
                )}
                {mode === 'signup' && 'Register for subscription management and recurring billing.'}
                {mode === 'forgot' && 'Enter your email to receive a secure recovery token.'}
                {mode === 'reset' && 'Choose a strong password compliant with security policy.'}
              </p>
            </header>

            {/* Feedback Alert Banner */}
            {feedback && (
              <Alert
                variant={feedback.type}
                title={feedback.title}
                message={feedback.message}
                onClose={() => setFeedback(null)}
              />
            )}

            {/* SUCCESS STATE: Forgot Password Dispatched */}
            {mode === 'forgot' && forgotSentEmail ? (
              <div className="compact-success-card">
                <div className="compact-success-icon">
                  <CheckCircle2 size={24} />
                </div>
                <div className="compact-success-body">
                  <h2 className="compact-success-title">Recovery Link Dispatched</h2>
                  <p className="compact-success-desc">
                    If an account exists for <span className="email-chip">{forgotSentEmail}</span>, a secure link has been generated.
                  </p>
                </div>
                <Button
                  variant="primary"
                  shape="pill"
                  size="md"
                  fullWidth
                  onClick={() => handleModeSwitch('login')}
                  icon={<ArrowLeft size={16} />}
                >
                  Return to Sign In
                </Button>
              </div>
            ) : mode === 'reset' && resetSuccess ? (
              /* SUCCESS STATE: Reset Password Completed */
              <div className="compact-success-card">
                <div className="compact-success-icon">
                  <CheckCircle2 size={24} />
                </div>
                <div className="compact-success-body">
                  <h2 className="compact-success-title">Password Updated</h2>
                  <p className="compact-success-desc">
                    Your credentials have been securely updated. You can now log in.
                  </p>
                </div>
                <Button
                  variant="primary"
                  shape="pill"
                  size="md"
                  fullWidth
                  onClick={() => handleModeSwitch('login')}
                  icon={<ArrowRight size={16} />}
                >
                  Proceed to Sign In
                </Button>
              </div>
            ) : (
              /* MAIN INTERACTIVE FORM */
              <form onSubmit={handleSubmit} className="auth-interactive-form" noValidate>
                {/* Email Field (Login, Signup, Forgot) */}
                {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
                  <Input
                    label="Email Address"
                    id="auth-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={
                      mode === 'login' && activeRole === 'admin' ? 'admin@brightloop.com' :
                      mode === 'login' && activeRole === 'staff' ? 'staff@brightloop.com' :
                      'name@company.com'
                    }
                    required
                    autoComplete="email"
                    autoFocus
                    error={errors.email}
                    leftIcon={<Mail size={15} />}
                  />
                )}

                {/* Password Field (Login, Signup, Reset) */}
                {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
                  <PasswordInput
                    label={mode === 'reset' ? 'New Password' : 'Password'}
                    id="auth-password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    autoComplete={mode === 'signup' || mode === 'reset' ? 'new-password' : 'current-password'}
                    error={errors.password}
                  />
                )}

                {/* Confirm Password Field (Signup, Reset) */}
                {(mode === 'signup' || mode === 'reset') && (
                  <PasswordInput
                    label="Confirm Password"
                    id="auth-confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    required
                    autoComplete="new-password"
                    error={errors.confirmPassword}
                  />
                )}

                {/* Compact Live Password Checklist Bar */}
                {(mode === 'signup' || mode === 'reset') && (
                  <div className="compact-policy-bar" aria-live="polite">
                    <span className="policy-label">POLICY:</span>
                    <span className={`policy-item ${passwordRules.hasMinLength ? 'valid' : ''}`}>
                      &gt;8 Chars {passwordRules.hasMinLength ? '✓' : ''}
                    </span>
                    <span className="policy-dot">•</span>
                    <span className={`policy-item ${passwordRules.hasUpper ? 'valid' : ''}`}>
                      Upper {passwordRules.hasUpper ? '✓' : ''}
                    </span>
                    <span className="policy-dot">•</span>
                    <span className={`policy-item ${passwordRules.hasLower ? 'valid' : ''}`}>
                      Lower {passwordRules.hasLower ? '✓' : ''}
                    </span>
                    <span className="policy-dot">•</span>
                    <span className={`policy-item ${passwordRules.hasSpecial ? 'valid' : ''}`}>
                      Special {passwordRules.hasSpecial ? '✓' : ''}
                    </span>
                  </div>
                )}

                {/* Helper Row: Remember Me & Forgot Password (Login mode only) */}
                {mode === 'login' && (
                  <div className="auth-helper-row">
                    <label className="auth-remember-label">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      {formData.rememberMe ? (
                        <CheckSquare size={16} className="checkbox-icon checked" />
                      ) : (
                        <Square size={16} className="checkbox-icon" />
                      )}
                      <span>Remember session</span>
                    </label>

                    <button
                      type="button"
                      className="auth-link-button label-mono"
                      onClick={() => handleModeSwitch('forgot')}
                    >
                      FORGOT PASSWORD?
                    </button>
                  </div>
                )}

                {/* Submit Action CTA Button */}
                <Button
                  type="submit"
                  variant="primary"
                  shape="pill"
                  size="md"
                  fullWidth
                  loading={loading}
                  icon={<ArrowRight size={16} />}
                >
                  {mode === 'login' && (
                    activeRole === 'admin' ? 'Sign In as Administrator' :
                    activeRole === 'staff' ? 'Sign In to Workspace' :
                    'Sign In to Customer Portal'
                  )}
                  {mode === 'signup' && 'Create Customer Account'}
                  {mode === 'forgot' && 'Send Recovery Link'}
                  {mode === 'reset' && 'Update Password'}
                </Button>
              </form>
            )}

            {/* Zero-scroll Micro Footer */}
            <footer className="auth-card-footer">
              <span className="footer-lock-badge label-mono">
                <Lock size={11} /> 256-BIT ENCRYPTION &bull; RBAC ENFORCED
              </span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
