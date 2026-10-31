import React from 'react';
import { Check, X } from 'lucide-react';
import './PasswordChecklist.css';

/**
 * Validates password according to Brightloop security policy:
 * - More than 8 characters (> 8)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one special character
 */
export function validatePasswordRules(password = '') {
  return {
    minLength: password.length > 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}

export function isPasswordValid(password = '') {
  const rules = validatePasswordRules(password);
  return rules.minLength && rules.hasUpper && rules.hasLower && rules.hasSpecial;
}

export default function PasswordChecklist({
  password = '',
  confirmPassword,
  showMatch = false,
}) {
  const rules = validatePasswordRules(password);
  const isMatch = showMatch && password.length > 0 && password === confirmPassword;

  const checklistItems = [
    {
      id: 'length',
      label: 'More than 8 characters (9+ chars)',
      valid: rules.minLength,
    },
    {
      id: 'upper',
      label: 'At least one uppercase letter (A-Z)',
      valid: rules.hasUpper,
    },
    {
      id: 'lower',
      label: 'At least one lowercase letter (a-z)',
      valid: rules.hasLower,
    },
    {
      id: 'special',
      label: 'At least one special character (!@#$%^&*)',
      valid: rules.hasSpecial,
    },
  ];

  if (showMatch) {
    checklistItems.push({
      id: 'match',
      label: 'Passwords match',
      valid: isMatch,
    });
  }

  const satisfiedCount = checklistItems.filter((item) => item.valid).length;
  const totalCount = checklistItems.length;
  const percent = Math.round((satisfiedCount / totalCount) * 100);

  return (
    <div className="password-checklist-card">
      <div className="checklist-header">
        <span className="checklist-title label-mono">PASSWORD POLICY</span>
        <span className="checklist-score label-mono">
          {satisfiedCount}/{totalCount} MET
        </span>
      </div>

      {/* High-contrast segmented meter */}
      <div className="checklist-meter" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`checklist-meter-fill ${percent === 100 ? 'meter-complete' : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="checklist-items">
        {checklistItems.map((item) => (
          <li
            key={item.id}
            className={`checklist-item ${item.valid ? 'item-valid' : 'item-pending'}`}
          >
            <span className="item-icon" aria-hidden="true">
              {item.valid ? <Check size={12} strokeWidth={3} /> : <span className="icon-bullet" />}
            </span>
            <span className="item-label">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
