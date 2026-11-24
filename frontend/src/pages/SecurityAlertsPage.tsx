import React, { useState, useEffect } from 'react';
import { alertsApi } from '../services/api.js';
import { Badge } from '../components/Badge.js';
import { Modal } from '../components/Modal.js';
import { SecurityAlert, AlertStatus, AlertSeverity } from '../types/index.js';

export const SecurityAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  // Triage / Update Modal
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [targetStatus, setTargetStatus] = useState<AlertStatus>('ACKNOWLEDGED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await alertsApi.list({
        status: statusFilter || undefined,
        severity: severityFilter || undefined
      });
      setAlerts(res.alerts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter]);

  const handleUpdateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setIsUpdating(true);
    try {
      await alertsApi.update(selectedAlert.id, {
        status: targetStatus,
        resolutionNotes
      });

      setSelectedAlert(null);
      setResolutionNotes('');
      fetchAlerts();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
            Security Incident & Threat Alerts
          </h1>
          <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
            Real-time heuristic anomaly detection, lockout monitoring, and SOC incident triage.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-wrap items-center justify-between gap-space-md">
        <div className="flex flex-wrap items-center gap-space-sm">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-[13px] text-on-surface focus:outline-none"
          >
            <option value="">All Alert Statuses</option>
            <option value="NEW">NEW</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="DISMISSED">DISMISSED</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="h-10 px-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-[13px] text-on-surface focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface-container-low/60 border-b border-outline-variant/30 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Alert Title</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Detected At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading alerts...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    No matching threat alerts found.
                  </td>
                </tr>
              ) : (
                alerts.map((alt) => (
                  <tr key={alt.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-3 px-4">
                      <Badge label={alt.severity} variant={alt.severity as any} />
                    </td>
                    <td className="py-3 px-4 font-bold text-on-surface">{alt.title}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-primary">{alt.type}</td>
                    <td className="py-3 px-4 text-on-surface-variant max-w-sm line-clamp-2">
                      {alt.description}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                        {alt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[12px] text-on-surface-variant whitespace-nowrap">
                      {new Date(alt.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAlert(alt);
                          setTargetStatus(alt.status);
                          setResolutionNotes(alt.resolutionNotes || '');
                        }}
                        className="px-3 py-1 rounded bg-surface-container-low hover:bg-surface-container text-primary font-bold text-[11px] border border-outline-variant/30 transition-colors"
                      >
                        Triage / Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Triage Modal */}
      <Modal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title={`Alert Triage: ${selectedAlert?.title}`}
      >
        {selectedAlert && (
          <form onSubmit={handleUpdateAlert} className="space-y-space-md text-[13px]">
            <div className="p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-1">
              <div>
                <strong>Severity:</strong> <Badge label={selectedAlert.severity} variant={selectedAlert.severity as any} />
              </div>
              <div>
                <strong>Anomaly Type:</strong> <code className="font-mono text-primary font-bold">{selectedAlert.type}</code>
              </div>
              <div className="mt-1 text-on-surface-variant">{selectedAlert.description}</div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[12px] font-semibold text-on-surface">Lifecycle Status</label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as AlertStatus)}
                className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-[13px] text-on-surface focus:outline-none"
              >
                <option value="NEW">NEW (Unacknowledged)</option>
                <option value="ACKNOWLEDGED">ACKNOWLEDGED (Under Observation)</option>
                <option value="INVESTIGATING">INVESTIGATING (SOC Active Investigation)</option>
                <option value="RESOLVED">RESOLVED (Threat Mitigated & Closed)</option>
                <option value="DISMISSED">DISMISSED (Benign False Positive)</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[12px] font-semibold text-on-surface">Resolution Notes & Findings</label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Document SOC investigation findings, containment steps taken..."
                className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-[13px] text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            <div className="flex justify-end gap-space-sm pt-space-sm border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 rounded-lg border border-outline-variant/40 text-[13px] font-semibold text-on-surface hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-bold text-[13px] hover:bg-primary-container disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Update Threat Status'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
