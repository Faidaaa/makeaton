import React from 'react';

/**
 * Card Component
 * High-contrast container with 2px solid black border and hard shadow.
 */
export default function Card({
  children,
  subtle = false,
  className = '',
  title,
  action,
  ...props
}) {
  const cardStyle = subtle ? 'bl-card-subtle' : 'bl-card';

  return (
    <div className={`${cardStyle} ${className}`} {...props}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          {title && <h3 className="font-bold">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
