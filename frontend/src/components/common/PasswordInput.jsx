import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import Input from './Input';
import './PasswordInput.css';

const PasswordInput = forwardRef(function PasswordInput(
  {
    label = 'Password',
    id = 'password',
    name = 'password',
    value,
    onChange,
    placeholder = '••••••••••••',
    error,
    helperText,
    required = true,
    showLockIcon = true,
    autoComplete = 'current-password',
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleButton = (
    <button
      type="button"
      className="password-toggle-btn"
      onClick={toggleVisibility}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      title={showPassword ? 'Hide password' : 'Show password'}
      tabIndex={0}
    >
      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <Input
      ref={ref}
      label={label}
      id={id}
      name={name}
      type={showPassword ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      error={error}
      helperText={helperText}
      required={required}
      leftIcon={showLockIcon ? <Lock size={16} /> : null}
      rightElement={toggleButton}
      autoComplete={autoComplete}
      {...props}
    />
  );
});

export default PasswordInput;
