import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute — guards a route by authentication and optional role check.
 *
 * Props:
 *   children     — the page component to render if access is granted
 *   allowedRoles — optional array of roles, e.g. ['admin'] or ['admin', 'staff']
 *                  if omitted, any authenticated user can access the route
 *
 * Behaviour:
 *   - While auth session is loading → show a blank loading screen
 *   - Not authenticated             → redirect to /login
 *   - Wrong role                    → redirect to /<user.role> (their own portal)
 *   - Authorized                    → render children
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100dvh',
          background: '#0a0a0a',
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          fontSize: '1rem',
        }}
      >
        Checking session…
      </div>
    );
  }

  if (!user) {
    // Preserve the attempted location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Send the user to their own portal instead of a generic 403
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
}

