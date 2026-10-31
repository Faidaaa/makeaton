import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import DashboardPlaceholder from './pages/DashboardPlaceholder';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route redirects to universal login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Unified Single-Screen Authentication Interface */}
        <Route path="/login" element={<AuthPage initialMode="login" />} />
        <Route path="/signup" element={<AuthPage initialMode="signup" />} />
        <Route path="/forgot-password" element={<AuthPage initialMode="forgot" />} />
        <Route path="/reset-password" element={<AuthPage initialMode="reset" />} />

        {/* Role-Based Destination Portals */}
        <Route path="/customer" element={<DashboardPlaceholder expectedRole="customer" />} />
        <Route path="/staff" element={<DashboardPlaceholder expectedRole="staff" />} />
        <Route path="/admin" element={<DashboardPlaceholder expectedRole="admin" />} />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
