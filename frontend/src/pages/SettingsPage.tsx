import React, { useState, useEffect } from 'react';
import { systemApi } from '../services/api.js';
import { SystemSetting } from '../types/index.js';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await systemApi.listSettings();
      setSettings(res.settings);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (key: string) => {
    setIsSaving(true);
    try {
      const res = await systemApi.updateSetting(key, editValue);
      setNotification({ message: res.message, type: 'success' });
      setEditingKey(null);
      fetchSettings();
    } catch (err: any) {
      setNotification({ message: err.message || 'Error updating setting', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-space-lg max-w-4xl">
      <div>
        <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
          System Security Policies & Global Settings
        </h1>
        <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
          Global enforcement thresholds for password authentication, brute-force lockouts, session lifetimes, and backup retention.
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

      {/* Settings Card */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden divide-y divide-outline-variant/20">
        {isLoading ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          settings.map((s) => {
            const isEditing = editingKey === s.key;

            return (
              <div key={s.id} className="p-space-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-md hover:bg-surface-container-low/20 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[14px] text-on-surface">{s.description || s.key}</span>
                    <span className="font-mono text-[11px] text-primary bg-surface-container px-2 py-0.5 rounded font-semibold">
                      {s.key}
                    </span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant/80 block">
                    Category: {s.category} &bull; Last updated by: {s.updatedBy || 'SYSTEM'} ({new Date(s.updatedAt).toLocaleDateString()})
                  </span>
                </div>

                <div className="flex items-center gap-space-sm">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] font-bold text-primary w-32 focus:outline-none focus:ring-2 focus:ring-secondary"
                      />
                      <button
                        type="button"
                        onClick={() => handleSave(s.key)}
                        disabled={isSaving}
                        className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[12px] font-bold hover:bg-primary-container disabled:opacity-50"
                      >
                        {isSaving ? '...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingKey(null)}
                        className="px-2.5 py-1.5 rounded-lg border border-outline-variant/40 text-[12px] font-semibold text-on-surface hover:bg-surface-container"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-space-md">
                      <span className="font-mono text-[16px] font-bold text-primary bg-surface-container px-3 py-1 rounded-lg">
                        {s.value}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingKey(s.key);
                          setEditValue(s.value);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-bold text-[12px] border border-outline-variant/30 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
