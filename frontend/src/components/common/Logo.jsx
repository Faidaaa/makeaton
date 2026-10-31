import React from 'react';
import { Link } from 'react-router-dom';
import './Logo.css';

export default function Logo({ size = 'md', showSubtitle = true, to = '/login' }) {
  const content = (
    <div className={`brightloop-logo logo-${size}`}>
      <div className="logo-symbol" aria-hidden="true">
        {/* Infinite subscription loop glyph in vermilion & sharp dark stroke */}
        <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="9" cy="14" r="5" stroke="var(--border-strong)" strokeWidth="2.5" />
          <circle cx="19" cy="14" r="5" stroke="var(--accent-primary)" strokeWidth="2.5" />
          <path d="M12 11.5L16 16.5" stroke="var(--border-strong)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="logo-text-group">
        <span className="logo-name">
          BRIGHT<span className="logo-name-accent">LOOP</span>
        </span>
        {showSubtitle && (
          <span className="logo-sublabel label-mono">SUBSCRIPTION OS</span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="logo-link" aria-label="Brightloop Home">
        {content}
      </Link>
    );
  }

  return content;
}
