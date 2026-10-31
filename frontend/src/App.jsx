import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
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

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
