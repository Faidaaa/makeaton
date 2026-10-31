import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import './Input.css';

const Input = forwardRef(function Input(
  {
    label,
    id,
    name,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    helperText,
    required = false,
    disabled = false,
    leftIcon = null,
    rightElement = null,
    className = '',
    inputClassName = '',
    autoComplete,
    autoFocus = false,
    ...props
  },
  ref
) {
  const inputId = id || name;

  return (
    <div className={`brightloop-input-group ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          <span>{label}</span>
          {required && <span className="label-required" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="input-wrapper">
        {leftIcon && <span className="input-icon-left" aria-hidden="true">{leftIcon}</span>}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className={`brightloop-input ${leftIcon ? 'with-left-icon' : ''} ${rightElement ? 'with-right-element' : ''} ${inputClassName}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />

        {rightElement && (
          <div className="input-element-right">{rightElement}</div>
        )}
      </div>

      {error ? (
        <div id={`${inputId}-error`} className="input-feedback feedback-error" role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <div id={`${inputId}-helper`} className="input-feedback feedback-helper">
          <span>{helperText}</span>
        </div>
      ) : null}
    </div>
  );
});

export default Input;
