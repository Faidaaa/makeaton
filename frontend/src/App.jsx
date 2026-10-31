import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import DashboardPlaceholder from './pages/DashboardPlaceholder';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default route redirects to universal login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Universal & Dedicated Role-Specific Login Portals */}
          <Route path="/login" element={<AuthPage initialMode="login" initialRole="customer" />} />
          <Route path="/admin/login" element={<AuthPage initialMode="login" initialRole="admin" />} />
          <Route path="/staff/login" element={<AuthPage initialMode="login" initialRole="staff" />} />
          <Route path="/customer/login" element={<AuthPage initialMode="login" initialRole="customer" />} />

          {/* Account Creation & Recovery */}
          <Route path="/signup" element={<AuthPage initialMode="signup" />} />
          <Route path="/forgot-password" element={<AuthPage initialMode="forgot" />} />
          <Route path="/reset-password" element={<AuthPage initialMode="reset" />} />

          {/* Role-Based Destination Portals — each protected by RBAC */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <DashboardPlaceholder expectedRole="customer" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <DashboardPlaceholder expectedRole="staff" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardPlaceholder expectedRole="admin" />
              </ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
