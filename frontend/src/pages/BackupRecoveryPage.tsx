import React, { useState, useEffect } from 'react';
import { backupsApi } from '../services/api.js';
import { Badge } from '../components/Badge.js';
import { Modal } from '../components/Modal.js';
import { BackupRecord } from '../types/index.js';

export const BackupRecoveryPage: React.FC = () => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Trigger Backup Modal
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [backupType, setBackupType] = useState<'FULL' | 'INCREMENTAL'>('FULL');
  const [notes, setNotes] = useState('');
  const [isTriggering, setIsTriggering] = useState(false);

  // Restore Drill Modal
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<any | null>(null);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchBackups = async () => {
    setIsLoading(true);
    try {
      const res = await backupsApi.list();
      setBackups(res.backups);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleTriggerBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTriggering(true);
    try {
      const res = await backupsApi.trigger({
        backupType,
        notes
      });

      setNotification({ message: res.message, type: 'success' });
      setTriggerModalOpen(false);
      setNotes('');
      fetchBackups();
    } catch (err: any) {
      setNotification({ message: err.message || 'Error creating backup', type: 'error' });
    } finally {
      setIsTriggering(false);
    }
  };

  const handleRestoreDrill = async () => {
    if (!selectedBackup) return;
    setIsRestoring(true);
    setRestoreResult(null);

    try {
      const res = await backupsApi.restoreDrill(selectedBackup.id);
      setRestoreResult(res);
      fetchBackups();
    } catch (err: any) {
      setNotification({ message: err.message || 'Restoration drill failed', type: 'error' });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
            Resilience, Backup & Recovery Console
          </h1>
          <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
            Cryptographically encrypted backups (AES-256-GCM), 3-2-1 storage verification, and isolated restore drills.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setTriggerModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-bold text-[13px] shadow-sm hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
          <span>Trigger Encrypted Backup</span>
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

      {/* RPO / RTO & 3-2-1 Compliance Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div className="p-space-md rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant text-[12px] mb-1 font-semibold">
            <span>RPO Target</span>
            <span className="material-symbols-outlined text-secondary text-[18px]">history</span>
          </div>
          <span className="text-[22px] font-bold text-on-surface block">24 Hours</span>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">Maximum permissible data loss</span>
        </div>

        <div className="p-space-md rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant text-[12px] mb-1 font-semibold">
            <span>RTO Target</span>
            <span className="material-symbols-outlined text-secondary text-[18px]">timer</span>
          </div>
          <span className="text-[22px] font-bold text-on-surface block">4 Hours</span>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">Maximum service restoration window</span>
        </div>

        <div className="p-space-md rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant text-[12px] mb-1 font-semibold">
            <span>Encryption Standard</span>
            <span className="material-symbols-outlined text-secondary text-[18px]">lock</span>
          </div>
          <span className="text-[20px] font-bold text-primary block">AES-256-GCM</span>
          <span className="text-[11px] text-on-surface-variant font-medium mt-1 block">Authenticated data-at-rest cipher</span>
        </div>

        <div className="p-space-md rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant text-[12px] mb-1 font-semibold">
            <span>3-2-1 Rule Protocol</span>
            <span className="material-symbols-outlined text-secondary text-[18px]">inventory_2</span>
          </div>
          <span className="text-[20px] font-bold text-secondary block">Compliant</span>
          <span className="text-[11px] text-on-surface-variant font-medium mt-1 block">3 copies, 2 media types, 1 offsite</span>
        </div>
      </div>

      {/* Backups Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface-container-low/60 border-b border-outline-variant/30 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3 px-4">Artifact Filename</th>
                <th className="py-3 px-4">Backup Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Encryption</th>
                <th className="py-3 px-4">SHA-256 Checksum</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Verification Drill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                    <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading backup records...
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                    No backup records found. Trigger an automated snapshot above.
                  </td>
                </tr>
              ) : (
                backups.map((bkp) => (
                  <tr key={bkp.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-[18px]">save</span>
                        <span className="font-mono font-bold text-primary text-[12px]">{bkp.filename}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-on-surface">{bkp.backupType}</td>
                    <td className="py-3 px-4 text-on-surface-variant font-mono text-[12px]">
                      {bkp.fileSize} bytes
                    </td>
                    <td className="py-3 px-4 font-bold text-secondary text-[11px]">{bkp.encryptionMethod}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant">
                      <span title={bkp.checksum || ''}>{bkp.checksum ? `${bkp.checksum.slice(0, 14)}...` : 'N/A'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge label={bkp.status} variant={bkp.status === 'SUCCESS' ? 'ACTIVE' : 'LOCKED'} />
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant text-[12px] whitespace-nowrap">
                      {new Date(bkp.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBackup(bkp);
                          setRestoreResult(null);
                          setRestoreModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-bold text-[11px] border border-outline-variant/30 transition-colors"
                      >
                        Restore Test Drill
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trigger Backup Modal */}
      <Modal isOpen={triggerModalOpen} onClose={() => setTriggerModalOpen(false)} title="Trigger Database Backup">
        <form onSubmit={handleTriggerBackup} className="space-y-space-md text-[13px]">
          <div className="flex flex-col space-y-1">
            <label className="text-[12px] font-semibold text-on-surface">Backup Type</label>
            <select
              value={backupType}
              onChange={(e) => setBackupType(e.target.value as any)}
              className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none"
            >
              <option value="FULL">FULL Snapshot (Complete Relational Schema & Records)</option>
              <option value="INCREMENTAL">INCREMENTAL (WAL Diff Archive)</option>
            </select>
          </div>

          <div className="p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-1 text-[12px]">
            <strong className="block text-primary font-bold">Cryptographic Protection:</strong>
            <p className="text-on-surface-variant">
              The backup artifact is encrypted with AES-256-GCM, signed with a SHA-256 integrity checksum, and stored strictly outside public web paths.
            </p>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[12px] font-semibold text-on-surface">Administrative Operator Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pre-deployment baseline snapshot before quarterly schema migration..."
              className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div className="flex justify-end gap-space-sm pt-space-sm border-t border-outline-variant/30">
            <button
              type="button"
              onClick={() => setTriggerModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isTriggering}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary font-bold hover:bg-primary-container disabled:opacity-50"
            >
              {isTriggering ? 'Creating & Encrypting...' : 'Create Backup Snapshot'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Restore Drill Modal */}
      <Modal
        isOpen={restoreModalOpen}
        onClose={() => setRestoreModalOpen(false)}
        title="Execute Restore Drill & Integrity Verification (AT-18)"
      >
        {selectedBackup && (
          <div className="space-y-space-md text-[13px]">
            <div className="p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-1">
              <div>
                <strong>Artifact:</strong> <code className="font-mono text-primary font-bold">{selectedBackup.filename}</code>
              </div>
              <div>
                <strong>Checksum:</strong> <code className="font-mono text-[11px] text-secondary">{selectedBackup.checksum}</code>
              </div>
              <p className="text-on-surface-variant mt-1 text-[12px]">
                This drill verifies that the encrypted backup artifact can be decrypted with AES-256-GCM, its SHA-256 checksum matches, and internal database records can be reconstructed within the 4-hour RTO.
              </p>
            </div>

            {restoreResult && (
              <div className="p-space-md rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-emerald-700">task_alt</span>
                  <strong className="font-bold text-[14px]">Restoration Verification Successful</strong>
                </div>
                <p className="text-[12px]">{restoreResult.message}</p>
                <div className="p-2 bg-white rounded-lg border border-emerald-200 font-mono text-[11px]">
                  <strong>Verified Record Counts:</strong>
                  <pre className="mt-1">{JSON.stringify(restoreResult.restoredDataSummary?.counts || {}, null, 2)}</pre>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-space-sm pt-space-sm border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setRestoreModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface hover:bg-surface-container"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleRestoreDrill}
                disabled={isRestoring}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-bold hover:bg-primary-container disabled:opacity-50"
              >
                {isRestoring ? 'Verifying & Restoring...' : 'Run Isolated Restore Drill'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
