import React, { useState, useEffect } from 'react';
import { incidentsApi } from '../services/api.js';
import { Badge } from '../components/Badge.js';
import { Modal } from '../components/Modal.js';
import { Incident, IncidentStatus, AlertSeverity } from '../types/index.js';

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('UNAUTHORIZED_ACCESS');
  const [severity, setSeverity] = useState<AlertSeverity>('MEDIUM');
  const [description, setDescription] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  // Manage Stage Modal
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [targetStatus, setTargetStatus] = useState<IncidentStatus>('TRIAGED');
  const [containmentNotes, setContainmentNotes] = useState('');
  const [eradicationNotes, setEradicationNotes] = useState('');
  const [recoveryNotes, setRecoveryNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchIncidents = async () => {
    setIsLoading(true);
    try {
      const res = await incidentsApi.list();
      setIncidents(res.incidents);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsReporting(true);
    try {
      await incidentsApi.create({
        title,
        category,
        severity,
        description
      });

      setReportModalOpen(false);
      setTitle('');
      setDescription('');
      fetchIncidents();
    } catch (err) {
      console.error(err);
    } finally {
      setIsReporting(false);
    }
  };

  const handleUpdateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    setIsUpdating(true);
    try {
      await incidentsApi.update(selectedIncident.id, {
        status: targetStatus,
        containmentNotes: containmentNotes || selectedIncident.containmentNotes,
        eradicationNotes: eradicationNotes || selectedIncident.eradicationNotes,
        recoveryNotes: recoveryNotes || selectedIncident.recoveryNotes
      });

      setSelectedIncident(null);
      fetchIncidents();
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
            Incident Response & Management
          </h1>
          <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
            Full lifecycle incident handling from detection and triage to containment, eradication, and review.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReportModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-bold text-[13px] shadow-sm hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">report</span>
          <span>Report Security Incident</span>
        </button>
      </div>

      {/* Incidents Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface-container-low/60 border-b border-outline-variant/30 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3 px-4">Tracking ID</th>
                <th className="py-3 px-4">Incident Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Response Stage</th>
                <th className="py-3 px-4">Reporter</th>
                <th className="py-3 px-4">Observed Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                    <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading incidents...
                  </td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                    No active incidents reported.
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">{inc.trackingNumber}</td>
                    <td className="py-3 px-4 font-bold text-on-surface">{inc.title}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{inc.category}</td>
                    <td className="py-3 px-4">
                      <Badge label={inc.severity} variant={inc.severity as any} />
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[11px] text-secondary uppercase bg-secondary-fixed/40 px-2 py-0.5 rounded-full">
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant">{inc.reporter.fullName}</td>
                    <td className="py-3 px-4 text-on-surface-variant text-[12px] whitespace-nowrap">
                      {new Date(inc.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIncident(inc);
                          setTargetStatus(inc.status);
                          setContainmentNotes(inc.containmentNotes || '');
                          setEradicationNotes(inc.eradicationNotes || '');
                          setRecoveryNotes(inc.recoveryNotes || '');
                        }}
                        className="px-3 py-1 rounded bg-surface-container-low hover:bg-surface-container text-primary font-bold text-[11px] border border-outline-variant/30 transition-colors"
                      >
                        Manage Stage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Modal */}
      <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Report Security Incident">
        <form onSubmit={handleReport} className="space-y-space-md text-[13px]">
          <div className="flex flex-col space-y-1">
            <label className="text-[12px] font-semibold text-on-surface">Incident Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Suspicious credential reuse attempt from foreign IP"
              className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col space-y-1">
              <label className="text-[12px] font-semibold text-on-surface">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none"
              >
                <option value="UNAUTHORIZED_ACCESS">Unauthorized Access Attempt</option>
                <option value="DATA_EXFILTRATION">Suspected Data Exfiltration</option>
                <option value="MALWARE_PHISHING">Phishing / Credential Harvest</option>
                <option value="PRIVILEGE_ABUSE">Privilege Escalation Abuse</option>
                <option value="POLICY_VIOLATION">Acceptable Use Policy Breach</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[12px] font-semibold text-on-surface">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
                className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[12px] font-semibold text-on-surface">Detailed Incident Narrative</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe observed anomalous activities, affected systems, log evidence references..."
              className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div className="flex justify-end gap-space-sm pt-space-sm border-t border-outline-variant/30">
            <button
              type="button"
              onClick={() => setReportModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isReporting}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary font-bold hover:bg-primary-container disabled:opacity-50"
            >
              {isReporting ? 'Submitting...' : 'Register Incident'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manage Stage Modal */}
      <Modal
        isOpen={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        title={`Incident Lifecycle: ${selectedIncident?.trackingNumber}`}
      >
        {selectedIncident && (
          <form onSubmit={handleUpdateStage} className="space-y-space-md text-[13px]">
            <div className="p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-1">
              <div>
                <strong>Title:</strong> {selectedIncident.title}
              </div>
              <div>
                <strong>Reporter:</strong> {selectedIncident.reporter.fullName}
              </div>
              <div className="text-on-surface-variant">{selectedIncident.description}</div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[12px] font-semibold text-on-surface">Target Response Lifecycle Stage</label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as IncidentStatus)}
                className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none"
              >
                <option value="TRIAGED">TRIAGED (Initial SOC Assessment)</option>
                <option value="CONTAINMENT">CONTAINMENT (Isolate Assets & Lock Accounts)</option>
                <option value="ERADICATION">ERADICATION (Neutralize Threat Vector)</option>
                <option value="RECOVERY">RECOVERY (Restore Normal Operations)</option>
                <option value="POST_INCIDENT_REVIEW">POST_INCIDENT_REVIEW (Post-Mortem Lessons)</option>
                <option value="CLOSED">CLOSED (Resolved & Audited)</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[12px] font-semibold text-on-surface">Containment Notes</label>
              <textarea
                rows={2}
                value={containmentNotes}
                onChange={(e) => setContainmentNotes(e.target.value)}
                placeholder="Isolation measures applied..."
                className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[12px] font-semibold text-on-surface">Eradication & Recovery Actions</label>
              <textarea
                rows={2}
                value={eradicationNotes}
                onChange={(e) => setEradicationNotes(e.target.value)}
                placeholder="Remediation steps completed..."
                className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-space-sm pt-space-sm border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-bold hover:bg-primary-container disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Advance Incident Stage'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
