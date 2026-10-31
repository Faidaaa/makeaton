import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the entire app.
 * On mount, calls GET /api/auth/me to restore session from HTTP-only cookie.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until session check completes

  /**
   * Check the current session on app load.
   * Silently sets user to null if not authenticated — never shows an error.
   */
  const checkSession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authService.me();
      if (data && (data.id || data.user)) {
        const currentUser = data.user || {
          id: data.id,
          email: data.email,
          role: data.role,
        };
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  /**
   * Log in and update auth state.
   * Returns the API response so callers can read success/message.
   */
  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    if (data.success && data.user) {
      setUser(data.user);
    }
    return data;
  }, []);

  /**
   * Register a new customer account.
   * Returns the API response so callers can handle errors.
   */
  const register = useCallback(async (email, password, fullName = '') => {
    const data = await authService.register(email, password, fullName);
    if (data.success && data.user) {
      setUser(data.user);
    }
    return data;
  }, []);

  /**
   * Log out, clear local state.
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Silently fail — still clear local state
    } finally {
      setUser(null);
    }
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth — access auth state from any component.
 *
 * @example
 * const { user, loading, login, logout } = useAuth();
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

