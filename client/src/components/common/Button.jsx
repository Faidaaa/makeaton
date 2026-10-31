import React from 'react';

/**
 * Button Component
 * Follows design.md: Orange primary actions, Blue secondary accents, crisp 2px borders.
 */
export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md',        // 'sm' | 'md' | 'lg'
  onClick,
  disabled = false,
  type = 'button',
  icon: Icon,
  className = '',
  ...props
}) {
  const variantClass = {
    primary: 'bl-btn-primary',
    secondary: 'bl-btn-secondary',
    outline: 'bl-btn-outline',
    danger: 'bl-btn-danger',
    ghost: 'bl-btn-ghost'
  }[variant] || 'bl-btn-primary';

  const sizeClass = size === 'sm' ? 'bl-btn-sm' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bl-btn ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}
