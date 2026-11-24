import React, { useState, useEffect } from 'react';
import { usersApi, rolesApi, systemApi } from '../services/api.js';
import { Badge } from '../components/Badge.js';
import { Modal } from '../components/Modal.js';
import { User, Role, OrganizationalUnit } from '../types/index.js';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [units, setUnits] = useState<OrganizationalUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Create User Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRoleId, setNewRoleId] = useState('');
  const [newUnitId, setNewUnitId] = useState('');
  const [newPassword, setNewPassword] = useState('SecureOrg#2026!');
  const [isCreating, setIsCreating] = useState(false);

  // Status Change Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('SUSPENDED');
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await usersApi.list({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        unitId: unitFilter || undefined
      });
      setUsers(res.users);
      setTotalPages(res.pagination.totalPages || 1);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter, unitFilter]);

  useEffect(() => {
    rolesApi.list().then((res) => {
      if (res?.roles) {
        setRoles(res.roles);
        if (res.roles.length > 0) setNewRoleId(res.roles[0].id);
      }
    });

    systemApi.listUnits().then((res) => {
      if (res?.units) setUnits(res.units);
    });
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await usersApi.create({
        fullName: newFullName,
        email: newEmail,
        phone: newPhone || undefined,
        unitId: newUnitId || undefined,
        roleId: newRoleId,
        initialPassword: newPassword
      });

      setNotification({ message: `User ${newEmail} successfully created.`, type: 'success' });
      setCreateModalOpen(false);
      setNewFullName('');
      setNewEmail('');
      setNewPhone('');
      fetchUsers();
    } catch (err: any) {
      setNotification({ message: err.message || 'Error creating user', type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsUpdatingStatus(true);
    try {
      await usersApi.updateStatus(selectedUser.id, {
        status: targetStatus,
        reason: statusReason
      });

      setNotification({
        message: `Account status for ${selectedUser.email} changed to ${targetStatus}.`,
        type: 'success'
      });
      setStatusModalOpen(false);
      setStatusReason('');
      fetchUsers();
    } catch (err: any) {
      setNotification({ message: err.message || 'Error updating status', type: 'error' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-space-lg">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
            User Management Directory
          </h1>
          <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
            Administer enterprise accounts, role assignments, organizational units, and state controls.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-bold text-[13px] shadow-sm hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>Invite / Create User</span>
        </button>
      </div>

      {notification && (
        <div
          className={`p-space-sm rounded-lg flex items-center justify-between text-[13px] font-medium border ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-error-container text-on-error-container border-error/30'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="p-1">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-wrap items-center justify-between gap-space-md">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative flex items-center">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-3">
            search
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email..."
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-low text-on-surface text-[13px] border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </form>

        <div className="flex flex-wrap items-center gap-space-sm">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-[13px] text-on-surface focus:outline-none"
          >
            <option value="">All Account Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="LOCKED">LOCKED</option>
            <option value="DEACTIVATED">DEACTIVATED</option>
          </select>

          <select
            value={unitFilter}
            onChange={(e) => {
              setUnitFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-[13px] text-on-surface focus:outline-none"
          >
            <option value="">All Organizational Units</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface-container-low/60 border-b border-outline-variant/30 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3 px-4">User Identity</th>
                <th className="py-3 px-4">Primary Role</th>
                <th className="py-3 px-4">Organizational Unit</th>
                <th className="py-3 px-4 text-center">MFA</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const primaryRole = u.userRoles?.[0]?.role?.displayName || 'Employee';
                  const isPrivileged = u.userRoles?.[0]?.role?.isPrivileged;

                  return (
                    <tr key={u.id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-[12px]">
                            {u.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-on-surface block leading-tight">{u.fullName}</span>
                            <span className="text-on-surface-variant text-[12px]">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            isPrivileged
                              ? 'bg-primary-fixed text-on-primary-fixed-variant'
                              : 'bg-surface-container text-on-surface'
                          }`}
                        >
                          {primaryRole}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-on-surface-variant">
                        {u.unit?.name || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {u.mfaEnabled ? (
                          <span className="material-symbols-outlined text-emerald-600 text-[18px]" title="MFA Enrolled">
                            verified
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-outline text-[18px]" title="MFA Not Enrolled">
                            cancel
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge label={u.status} variant={u.status as any} />
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant text-[12px]">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never logged in'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(u);
                            setTargetStatus(u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                            setStatusModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded bg-surface-container-low hover:bg-surface-container text-primary font-bold text-[11px] border border-outline-variant/30 transition-colors"
                        >
                          Modify State
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-outline-variant/20 flex items-center justify-between text-[12px] text-on-surface-variant">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded bg-surface-container-low hover:bg-surface-container disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded bg-surface-container-low hover:bg-surface-container disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Invite / Create Account">
        <form onSubmit={handleCreateUser} className="space-y-space-md">
          <div className="flex flex-col space-y-1">
            <label className="text-[12px] font-semibold text-on-surface">Full Name</label>
            <input
              type="text"
              required
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="e.g. Elena Rostova"
              className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-[13px] text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[12px] font-semibold text-on-surface">Work Email</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="elena@secureorg.io"
              className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-[13px] text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col space-y-1">
              <label className="text-[12px] font-semibold text-on-surface">Role</label>
              <select
                value={newRoleId}
                onChange={(e) => setNewRoleId(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-[13px] text-on-surface focus:outline-none"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[12px] font-semibold text-on-surface">Department</label>
              <select
                value={newUnitId}
                onChange={(e) => setNewUnitId(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-[13px] text-on-surface focus:outline-none"
              >
                <option value="">None / Corporate</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[12px] font-semibold text-on-surface">Initial Master Password</label>
            <input
              type="text"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-[13px] font-mono text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <span className="text-[11px] text-on-surface-variant">Min 12 chars with complexity standard</span>
          </div>

          <div className="flex justify-end gap-space-sm pt-space-sm border-t border-outline-variant/30">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-outline-variant/40 text-[13px] font-semibold text-on-surface hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary font-bold text-[13px] hover:bg-primary-container disabled:opacity-50"
            >
              {isCreating ? 'Provisioning...' : 'Provision User Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modify State Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`Modify State: ${selectedUser?.email}`}
      >
        <form onSubmit={handleStatusChange} className="space-y-space-md">
          <div className="flex flex-col space-y-1">
            <label className="text-[12px] font-semibold text-on-surface">Target Account Status</label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-[13px] text-on-surface focus:outline-none"
            >
              <option value="ACTIVE">ACTIVE (Reactivate & Clear Lockout)</option>
              <option value="SUSPENDED">SUSPENDED (Temporary Administrative Freeze)</option>
              <option value="LOCKED">LOCKED (Security Lockout)</option>
              <option value="DEACTIVATED">DEACTIVATED (Revoke Access & Sessions)</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[12px] font-semibold text-on-surface">
              Administrative Justification / Reason (Audited)
            </label>
            <textarea
              required
              rows={3}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Provide reason for this state transition (e.g. Employee requested leave, security investigation...)"
              className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-[13px] text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div className="flex justify-end gap-space-sm pt-space-sm border-t border-outline-variant/30">
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-outline-variant/40 text-[13px] font-semibold text-on-surface hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingStatus}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary font-bold text-[13px] hover:bg-primary-container disabled:opacity-50"
            >
              {isUpdatingStatus ? 'Applying...' : 'Enforce State Transition'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
