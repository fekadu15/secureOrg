import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredPermission?: string;
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRoles
}) => {
  const { user, isLoading, isAuthenticated, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-space-sm">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="font-label-md text-on-surface-variant text-[13px] tracking-wide">
            Validating Enclave Session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Permission authorization check
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="p-space-xl flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-error-container text-error flex items-center justify-center mb-space-md shadow-sm">
          <span className="material-symbols-outlined text-[36px]">shield_lock</span>
        </div>
        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs font-bold">
          Access Restricted
        </h2>
        <p className="font-body-md text-on-surface-variant max-w-md mb-space-lg">
          Your role credentials lack the required permission: <code className="font-mono text-primary font-semibold">{requiredPermission}</code>.
          This security decision is server-enforced and has been logged to the audit trail.
        </p>
      </div>
    );
  }

  // Role authorization check
  if (requiredRoles && requiredRoles.length > 0 && !hasRole(...requiredRoles)) {
    return (
      <div className="p-space-xl flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-error-container text-error flex items-center justify-center mb-space-md shadow-sm">
          <span className="material-symbols-outlined text-[36px]">gpp_bad</span>
        </div>
        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs font-bold">
          Unauthorized Organizational Role
        </h2>
        <p className="font-body-md text-on-surface-variant max-w-md mb-space-lg">
          This secure administrative module requires one of the following roles: <span className="font-semibold">{requiredRoles.join(', ')}</span>.
        </p>
      </div>
    );
  }

  return children;
};
