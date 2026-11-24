import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { Layout } from './components/Layout.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';

import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';
import { MfaVerificationPage } from './pages/MfaVerificationPage.js';
import { MfaEnrollmentPage } from './pages/MfaEnrollmentPage.js';


import { DashboardPage } from './pages/DashboardPage.js';
import { UsersPage } from './pages/UsersPage.js';
import { RolesPermissionsPage } from './pages/RolesPermissionsPage.js';
import { RoleRequestsPage } from './pages/RoleRequestsPage.js';
import { OrganizationalUnitsPage } from './pages/OrganizationalUnitsPage.js';
import { AuditLogsPage } from './pages/AuditLogsPage.js';
import { SecurityAlertsPage } from './pages/SecurityAlertsPage.js';
import { IncidentsPage } from './pages/IncidentsPage.js';
import { RiskRegisterPage } from './pages/RiskRegisterPage.js';
import { BackupRecoveryPage } from './pages/BackupRecoveryPage.js';
import { SecurityPoliciesPage } from './pages/SecurityPoliciesPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { MyProfilePage } from './pages/MyProfilePage.js';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/mfa-verification" element={<MfaVerificationPage />} />

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Identity & Access */}
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredPermission="user.read">
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roles"
              element={
                <ProtectedRoute requiredPermission="role.read">
                  <RolesPermissionsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/role-requests" element={<RoleRequestsPage />} />
            <Route path="/organizational-units" element={<OrganizationalUnitsPage />} />

            {/* Security Operations */}
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute requiredPermission="audit.read">
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute requiredPermission="alert.read">
                  <SecurityAlertsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/incidents"
              element={
                <ProtectedRoute requiredPermission="incident.read">
                  <IncidentsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/risks" element={<RiskRegisterPage />} />

            {/* Resilience */}
            <Route
              path="/backups"
              element={
                <ProtectedRoute requiredPermission="backup.create">
                  <BackupRecoveryPage />
                </ProtectedRoute>
              }
            />

            {/* Governance */}
            <Route path="/policies" element={<SecurityPoliciesPage />} />

           
            <Route
              path="/settings"
              element={
                <ProtectedRoute requiredPermission="settings.manage">
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/my-profile" element={<MyProfilePage />} />
            <Route path="/mfa-enrollment" element={<MfaEnrollmentPage />} />
          </Route>

         
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
