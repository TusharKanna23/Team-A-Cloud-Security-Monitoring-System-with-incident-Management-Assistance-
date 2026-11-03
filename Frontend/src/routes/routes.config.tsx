import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Dashboard } from '../pages';
import Login from '../pages/Login';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<div style={{ padding: '24px' }}>403 - Unauthorized Access</div>} />

      {/* Accessible by All Authenticated Users */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'ANALYST', 'VIEWER']} />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      {/* Analyst and Admin Access */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'ANALYST']} />}>
        <Route path="/analytics" element={<div style={{ padding: '24px' }}>Analytics View</div>} />
      </Route>

      {/* Admin Only Access */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin/settings" element={<div style={{ padding: '24px' }}>Admin Panel</div>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};