/**
 * Password Validator for Brightloop.
 * Enforces identical rules on frontend and backend:
 *   - At least 9 characters (>8)
 *   - At least one uppercase letter (A-Z)
 *   - At least one lowercase letter (a-z)
 *   - At least one special character from !@#$%^&*()
 */

const SPECIAL_CHARS = /[!@#$%^&*()]/;

export function validatePasswordRules(password = '') {
  return {
    minLength: password.length >= 9,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasSpecial: SPECIAL_CHARS.test(password),
  };
}

export function isPasswordValid(password = '') {
  const rules = validatePasswordRules(password);
  return rules.minLength && rules.hasUpper && rules.hasLower && rules.hasSpecial;
}

/**
 * Returns a human-readable array of unmet password requirements.
 */
export function getPasswordErrors(password = '') {
  const rules = validatePasswordRules(password);
  const errors = [];

  if (!rules.minLength) errors.push('Must be at least 9 characters.');
  if (!rules.hasUpper) errors.push('Must contain at least one uppercase letter (A-Z).');
  if (!rules.hasLower) errors.push('Must contain at least one lowercase letter (a-z).');
  if (!rules.hasSpecial) errors.push('Must contain at least one special character (!@#$%^&*()).');

  return errors;
}

