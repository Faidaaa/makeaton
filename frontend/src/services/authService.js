/**
 * Centralized Authentication Service
 * All API calls use credentials: 'include' to send HTTP-only cookies.
 * Never stores JWT in localStorage.
 */

const BASE = '/api/auth';

const handleResponse = async (response) => {
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (response.status === 429
        ? 'Too many requests. Please wait a few moments.'
        : response.status === 401
        ? 'Invalid credentials.'
        : response.status >= 500
        ? 'Backend service is currently unavailable. Ensure the server is running on port 5000.'
        : `Request failed with status ${response.status}.`);

    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const authService = {
  /** Register a new customer account */
  register: (email, password, fullName = '') =>
    fetch(`${BASE}/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    }).then(handleResponse),

  /** Log in with email and password */
  login: (email, password) =>
    fetch(`${BASE}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(handleResponse),

  /** Log out and clear auth cookie */
  logout: () =>
    fetch(`${BASE}/logout`, {
      method: 'POST',
      credentials: 'include',
    }).then(handleResponse),

  /** Get the currently authenticated user (returns null if unauthenticated) */
  me: async () => {
    try {
      const response = await fetch(`${BASE}/me`, {
        credentials: 'include',
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  },

  /** Send a forgot-password email */
  forgotPassword: (email) =>
    fetch(`${BASE}/forgot-password`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).then(handleResponse),

  /** Reset password using the token from the email link */
  resetPassword: (token, password) =>
    fetch(`${BASE}/reset-password`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    }).then(handleResponse),
};
