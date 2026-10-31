import React from 'react';

/**
 * Badge Component
 * Displays lifecycle statuses and tags using design.md high-contrast styling.
 */
export default function Badge({ status = 'draft', label, size = 'md', className = '' }) {
  const normalized = status.toLowerCase();
  
  const statusClasses = {
    draft: 'bl-badge-draft',
    quotation: 'bl-badge-quotation',
    confirmed: 'bl-badge-confirmed',
    active: 'bl-badge-active',
    closed: 'bl-badge-closed',
    sent: 'bl-badge-quotation',
    accepted: 'bl-badge-active',
    rejected: 'bl-badge-closed',
    expired: 'bl-badge-draft'
  };

  const badgeClass = statusClasses[normalized] || 'bl-badge-draft';
  const sizeClass = size === 'sm' ? 'text-xs py-0.5 px-1.5' : '';

  return (
    <span className={`bl-badge ${badgeClass} ${sizeClass} ${className}`}>
      <span style={{ 
        width: '6px', 
        height: '6px', 
        borderRadius: '50%', 
        backgroundColor: 'currentColor', 
        display: 'inline-block' 
      }}></span>
      {label || status.toUpperCase()}
    </span>
  );
}
