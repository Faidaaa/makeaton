import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

/**
 * Modal Component
 * Used for lifecycle confirmation dialogs and forms.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '520px'
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="bl-modal-backdrop" onClick={onClose}>
      <div
        className="bl-modal-dialog"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '2px solid var(--border-strong)' }}>
          <h3 className="font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 cursor-pointer"
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">{children}</div>

        {footer && (
          <div className="flex justify-end gap-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
