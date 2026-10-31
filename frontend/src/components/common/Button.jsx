import React from 'react';
import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  shape = 'pill',
  size = 'md',
  fullWidth = false,
  type = 'button',
  disabled = false,
  loading = false,
  icon = null,
  onClick,
  className = '',
  ...props
}) {
  const classes = [
    'brightloop-btn',
    `btn-${variant}`,
    `btn-shape-${shape}`,
    `btn-${size}`,
    fullWidth ? 'btn-full-width' : '',
    loading ? 'btn-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner" aria-hidden="true" />
      ) : icon ? (
        <span className="btn-icon" aria-hidden="true">{icon}</span>
      ) : null}
      <span className="btn-content">{children}</span>
    </button>
  );
}
