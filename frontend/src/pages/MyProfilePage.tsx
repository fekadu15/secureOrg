import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { usersApi } from '../services/api.js';

export const MyProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isUpdating, setIsUpdating] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (newPassword) {
      if (newPassword.length < 12) {
        setNotification({ message: 'New password must be at least 12 characters long.', type: 'error' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setNotification({ message: 'New passwords do not match.', type: 'error' });
        return;
      }
      if (!currentPassword) {
        setNotification({ message: 'Current password is required to change password.', type: 'error' });
        return;
      }
    }

    setIsUpdating(true);
    try {
      await usersApi.updateProfile({
        fullName,
        phone: phone || undefined,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      });

      setNotification({ message: 'Profile updated successfully.', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser();
    } catch (err: any) {
      setNotification({ message: err.message || 'Error updating profile', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-space-lg max-w-3xl">
      <div>
        <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
          User Identity & Profile
        </h1>
        <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
          Manage your organizational profile credentials, biometric/TOTP factor, and active session tokens.
        </p>
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

      {/* Profile Overview Card */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-space-lg flex items-center gap-space-lg">
        <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-bold text-[24px] shadow-sm">
          {user?.fullName?.charAt(0) || 'U'}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="font-title-lg text-title-lg text-on-surface font-bold">{user?.fullName}</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[11px] font-bold">
              {user?.roles?.[0]?.replace('_', ' ') || 'Employee'}
            </span>
          </div>
          <span className="text-[13px] text-on-surface-variant block">{user?.email}</span>
          <span className="text-[11px] text-on-surface-variant/70 block">
            Unit: {user?.unit?.name || 'Unassigned'} &bull; Status: <strong className="text-emerald-700">{user?.status}</strong>
          </span>
        </div>
      </div>

      {/* MFA Security Card */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-space-lg flex items-center justify-between gap-space-md">
        <div className="flex items-start gap-space-md">
          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary mt-0.5">
            <span className="material-symbols-outlined text-[24px]">phonelink_lock</span>
          </div>
          <div>
            <h3 className="font-title-md text-on-surface font-bold">Multi-Factor Authentication (TOTP)</h3>
            <p className="text-[13px] text-on-surface-variant mt-0.5 leading-relaxed">
              Require a 6-digit Time-Based One-Time Password from Google Authenticator on every sign-in.
            </p>
            <div className="mt-2">
              {user?.mfaEnabled ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  <span>Active &amp; Protected</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-300">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  <span>Not Enabled</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <Link
          to="/mfa-enrollment"
          className="px-4 py-2.5 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container font-bold text-[13px] transition-colors whitespace-nowrap shadow-sm"
        >
          {user?.mfaEnabled ? 'Re-Enroll / Backup Codes' : 'Enroll MFA Factor'}
        </Link>
      </div>

      {/* Profile & Password Form */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-space-lg">
        <h3 className="font-title-md text-on-surface font-bold pb-space-sm border-b border-outline-variant/20 mb-space-md">
          Update Profile & Master Password
        </h3>

        <form onSubmit={handleUpdate} className="space-y-space-md text-[13px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col space-y-1">
              <label className="text-[12px] font-semibold text-on-surface">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[12px] font-semibold text-on-surface">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+251 91 234 5678"
                className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
          </div>

          <div className="pt-space-sm border-t border-outline-variant/20 space-y-space-md">
            <span className="font-bold text-[13px] text-secondary uppercase tracking-wider block">
              Change Master Password (Optional)
            </span>

            <div className="flex flex-col space-y-1">
              <label className="text-[12px] font-semibold text-on-surface">Current Master Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Required only when changing password"
                className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <div className="flex flex-col space-y-1">
                <label className="text-[12px] font-semibold text-on-surface">New Master Password (Min 12 Chars)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[12px] font-semibold text-on-surface">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-space-sm border-t border-outline-variant/20">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-bold text-[13px] hover:bg-primary-container disabled:opacity-50 transition-colors shadow-sm"
            >
              {isUpdating ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
