import React, { useState, useEffect } from 'react';
import { rolesApi } from '../services/api.js';
import { Role, Permission } from '../types/index.js';

export const RolesPermissionsPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([rolesApi.list(), rolesApi.listPermissions()])
      .then(([rolesRes, permsRes]) => {
        setRoles(rolesRes.roles);
        if (rolesRes.roles.length > 0) setSelectedRole(rolesRes.roles[0]);
        setPermissions(permsRes.permissions);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Group permissions by module
  const modules = Array.from(new Set(permissions.map((p) => p.module)));

  return (
    <div className="space-y-space-lg">
      <div>
        <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
          Role-Based Access Control (RBAC) Matrix
        </h1>
        <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
          Explicit least-privilege permission matrix, separation of duties, and role entitlement boundaries.
        </p>
      </div>

      {/* Role Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {roles.map((r) => {
          const isSelected = selectedRole?.id === r.id;
          return (
            <div
              key={r.id}
              onClick={() => setSelectedRole(r)}
              className={`p-space-md rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-surface-container-lowest border-secondary shadow-md ring-2 ring-secondary/20'
                  : 'bg-surface-container-lowest border-outline-variant/30 hover:border-secondary/40 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-space-xs">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">
                    {r.isPrivileged ? 'admin_panel_settings' : 'badge'}
                  </span>
                </div>
                {r.isPrivileged && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                    PRIVILEGED
                  </span>
                )}
              </div>
              <h3 className="font-title-md text-[15px] text-on-surface font-bold">{r.displayName}</h3>
              <p className="text-[12px] text-on-surface-variant line-clamp-2 mt-1">{r.description}</p>
              <div className="mt-3 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
                <span>{r.userCount || 0} Assigned Users</span>
                <span className="font-semibold text-secondary">
                  {r.permissions?.length || 0} Permissions
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Detail & Permissions Mapping */}
      {selectedRole && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-space-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-space-md border-b border-outline-variant/30 gap-space-sm mb-space-lg">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                  {selectedRole.displayName}
                </h2>
                <span className="font-mono text-[12px] bg-surface-container px-2 py-0.5 rounded text-primary font-bold">
                  {selectedRole.name}
                </span>
              </div>
              <p className="text-[13px] text-on-surface-variant mt-0.5">{selectedRole.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-on-surface-variant font-medium">
                Granted Capabilities: <strong className="text-primary">{selectedRole.permissions?.length || 0}</strong> of {permissions.length}
              </span>
            </div>
          </div>

          {/* Module-by-Module Permission Checkboxes */}
          <div className="space-y-space-lg">
            {modules.map((mod) => {
              const modPermissions = permissions.filter((p) => p.module === mod);

              return (
                <div key={mod} className="space-y-space-xs">
                  <h4 className="text-[12px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">folder_special</span>
                    <span>{mod}</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-sm">
                    {modPermissions.map((perm) => {
                      const isGranted = selectedRole.permissions?.some((rp) => rp.id === perm.id);

                      return (
                        <div
                          key={perm.id}
                          className={`p-3 rounded-xl border flex items-start gap-2.5 transition-colors ${
                            isGranted
                              ? 'bg-secondary-fixed/20 border-secondary/40 text-on-surface'
                              : 'bg-surface-container-low/30 border-outline-variant/20 text-on-surface-variant/60'
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[18px] mt-0.5 ${
                              isGranted ? 'text-secondary' : 'text-outline/40'
                            }`}
                          >
                            {isGranted ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-bold leading-tight truncate">{perm.name}</span>
                            <code className="text-[11px] font-mono text-primary font-semibold">{perm.code}</code>
                            <span className="text-[11px] text-on-surface-variant/80 mt-0.5 line-clamp-1">
                              {perm.description}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
