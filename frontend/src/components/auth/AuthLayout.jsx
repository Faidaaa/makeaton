import React from 'react';
import { NavLink } from 'react-router-dom';
import Logo from '../common/Logo';
import IllustrationPanel from './IllustrationPanel';
import './AuthLayout.css';

export default function AuthLayout({
  children,
  title,
  subtitle,
  badge = 'AUTH PORTAL',
}) {
  return (
    <div className="auth-root-layout">
      {/* Top Quick Navigation Bar for Easy Review of all 5 Pages */}
      <header className="auth-quick-nav" aria-label="Authentication Flow Navigation">
        <div className="quick-nav-inner">
          <span className="quick-nav-label label-mono">AUTH PAGES:</span>
          <nav className="quick-nav-links">
            <NavLink to="/login" className={({ isActive }) => `quick-nav-link label-mono ${isActive ? 'active' : ''}`}>
              LOGIN
            </NavLink>
            <NavLink to="/signup" className={({ isActive }) => `quick-nav-link label-mono ${isActive ? 'active' : ''}`}>
              SIGNUP
            </NavLink>
            <NavLink to="/forgot-password" className={({ isActive }) => `quick-nav-link label-mono ${isActive ? 'active' : ''}`}>
              FORGOT PASSWORD
            </NavLink>
            <NavLink to="/reset-password" className={({ isActive }) => `quick-nav-link label-mono ${isActive ? 'active' : ''}`}>
              RESET PASSWORD
            </NavLink>
            <NavLink to="/verify-email" className={({ isActive }) => `quick-nav-link label-mono ${isActive ? 'active' : ''}`}>
              VERIFY EMAIL
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Main Split Screen Container */}
      <main className="auth-split-container">
        {/* Left Side: Authentication Form Section */}
        <section className="auth-form-column">
          <div className="auth-form-inner">
            {/* Brand Logo Header */}
            <div className="auth-brand-header">
              <Logo size="md" />
              {badge && (
                <span className="auth-badge label-mono">{badge}</span>
              )}
            </div>

            {/* Page Title & Context Header */}
            {(title || subtitle) && (
              <div className="auth-context-header">
                {title && <h1 className="auth-title">{title}</h1>}
                {subtitle && <p className="auth-subtitle">{subtitle}</p>}
              </div>
            )}

            {/* Form Slot */}
            <div className="auth-card-body">
              {children}
            </div>

            {/* Subtle Security / Copyright Footer */}
            <footer className="auth-footer">
              <div className="auth-footer-status">
                <span className="status-indicator-dot" />
                <span className="label-mono">HTTP-ONLY COOKIES // SHA-256 RBAC GUARD</span>
              </div>
              <div className="auth-footer-copy label-mono">
                BRIGHTLOOP © {new Date().getFullYear()} • ALL RIGHTS RESERVED
              </div>
            </footer>
          </div>
        </section>

        {/* Right Side: SaaS Visual Illustration Panel */}
        <section className="auth-illustration-column">
          <IllustrationPanel />
        </section>
      </main>
    </div>
  );
}
