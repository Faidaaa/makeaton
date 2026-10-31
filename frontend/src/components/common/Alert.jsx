import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import './Alert.css';

export default function Alert({
  variant = 'info', // 'info' | 'error' | 'success' | 'warning'
  title,
  message,
  children,
  onClose,
  className = '',
}) {
  const getIcon = () => {
    switch (variant) {
      case 'error':
        return <AlertCircle size={18} className="alert-icon" />;
      case 'success':
        return <CheckCircle2 size={18} className="alert-icon" />;
      case 'warning':
      case 'info':
      default:
        return <Info size={18} className="alert-icon" />;
    }
  };

  return (
    <div className={`brightloop-alert alert-${variant} ${className}`} role="alert">
      <div className="alert-icon-container">{getIcon()}</div>
      <div className="alert-body">
        {title && <div className="alert-title">{title}</div>}
        <div className="alert-text">{message || children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          className="alert-close-btn"
          onClick={onClose}
          aria-label="Dismiss alert"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
