/**
 * Subscription Lifecycle State Machine
 * Strictly enforces: Draft → Quotation → Confirmed → Active → Closed
 */

export const SUBSCRIPTION_STATUSES = {
  DRAFT: 'Draft',
  QUOTATION: 'Quotation',
  CONFIRMED: 'Confirmed',
  ACTIVE: 'Active',
  CLOSED: 'Closed'
};

// Allowed progression transitions
const ALLOWED_TRANSITIONS = {
  Draft: ['Quotation', 'Closed'],
  Quotation: ['Confirmed', 'Draft', 'Closed'],
  Confirmed: ['Active', 'Closed'],
  Active: ['Closed'], // Active subscriptions can be closed/cancelled, or paused via pause toggle
  Closed: ['Draft']   // Closed can only be re-opened as a new draft/renewal
};

/**
 * Validates a requested subscription transition
 * @param {string} currentStatus 
 * @param {string} nextStatus 
 * @returns {{ isValid: boolean, message?: string }}
 */
export function validateLifecycleTransition(currentStatus, nextStatus) {
  if (!currentStatus || !nextStatus) {
    return { isValid: false, message: 'Both currentStatus and nextStatus are required.' };
  }

  const validStatuses = Object.values(SUBSCRIPTION_STATUSES);
  if (!validStatuses.includes(nextStatus)) {
    return {
      isValid: false,
      message: `Invalid status "${nextStatus}". Allowed statuses are: ${validStatuses.join(', ')}.`
    };
  }

  if (currentStatus === nextStatus) {
    return { isValid: false, message: `Subscription is already in "${currentStatus}" status.` };
  }

  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(nextStatus)) {
    return {
      isValid: false,
      message: `Illegal transition: Cannot move directly from "${currentStatus}" to "${nextStatus}". Required lifecycle progression is: Draft → Quotation → Confirmed → Active → Closed.`
    };
  }

  return { isValid: true };
}
