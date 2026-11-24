import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-space-sm px-space-sm py-space-sm rounded-lg text-label-lg font-medium transition-colors ${
      isActive
        ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
    }`;

  const userRole = user?.roles?.[0] || 'Employee';

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-surface-container-low z-50 flex flex-col justify-between py-space-lg shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-outline-variant/30">
      {/* Brand & Organization */}
      <div className="px-space-md flex items-center gap-space-sm mb-space-md">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
          <span className="material-symbols-outlined text-[24px]">shield</span>
        </div>
        <div className="flex flex-col">
          <span className="font-title-md text-title-md text-primary font-bold tracking-tight">SecureOrg</span>
          <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">Enterprise Security</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto px-space-sm space-y-space-md custom-scrollbar">
        {/* Main */}
        <div>
          <div className="px-space-sm mb-space-xs font-label-sm text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
            Main
          </div>
          <NavLink to="/dashboard" className={navItemClass}>
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span>Dashboard</span>
          </NavLink>
        </div>

        {/* Identity & Access */}
        <div>
          <div className="px-space-sm mb-space-xs font-label-sm text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
            Identity & Access
          </div>
          <NavLink to="/users" className={navItemClass}>
            <span className="material-symbols-outlined text-[20px]">group</span>
            <span>Users</span>
          </NavLink>
          <NavLink to="/organizational-units" className={navItemClass}>
            <span className="material-symbols-outlined text-[20px]">account_tree</span>
            <span>Org Units</span>
          </NavLink>
          <NavLink to="/roles" className={navItemClass}>
            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
            <span>Roles & Permissions</span>
          </NavLink>
          <NavLink to="/role-requests" className={navItemClass}>
            <span className="material-symbols-outlined text-[20px]">assignment_ind</span>
            <span>Role Change Requests</span>
          </NavLink>
        </div>

        {/* Security Operations */}
        <div>
          <div className="px-space-sm mb-space-xs font-label-sm text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
            Security Operations
          </div>
          <NavLink to="/audit-logs" className={navItemClass}>
            <span className="material-symbols-outlined text-[20px]">history</span>
            <span>Audit Logs</span>
          </NavLink>
          <NavLink to="/alerts" className={navItemClass}>
            <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            <span>Security Alerts</span>
          </NavLink>
          <NavLink to="/incidents" className={navItemClass}>
            <span className="material-symbols-outlined text-[20px]">report_problem</span>
            <span>Incidents</span>
          </NavLink>
          <NavLink to="/risks" className={navItemClass}>
            <span className="material-symbols-outlined text-[20px]">gpp_maybe</span>
            <span>Risk Register</span>
          </NavLink>
        </div>

        {/* Resilience */}
        <div>
          <div className="px-space-sm mb-space-xs font-label-sm text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
            Resilience
          </div>
          <NavLink to="/backups" className={navItemClass}>
            <span className="material-symbols-outlined text-[20px]">backup</span>
            <span>Backup & Recovery</span>
          </NavLink>
        </div>

        {/* Governance */}
        <div>
          <div className="px-space-sm mb-space-xs font-label-sm text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
            Governance
          </div>
          <NavLink to="/policies" className={navItemClass}>
            <span className="material-symbols-outlined text-[20px]">policy</span>
            <span>Security Policies</span>
          </NavLink>
        </div>

        {/* System */}
        <div>
          <div className="px-space-sm mb-space-xs font-label-sm text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
            System
          </div>
          <NavLink to="/settings" className={navItemClass}>
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span>Settings</span>
          </NavLink>
          <NavLink to="/my-profile" className={navItemClass}>
            <span className="material-symbols-outlined text-[20px]">person</span>
            <span>My Profile</span>
          </NavLink>
        </div>
      </nav>

      {/* User Status Card */}
      <div className="px-space-md pt-space-md border-t border-outline-variant/20">
        <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-semibold text-[14px]">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-lg text-label-md text-on-surface truncate font-medium">
                {user?.fullName || 'User'}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[11px] font-semibold w-fit">
                {userRole.replace('_', ' ')}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
