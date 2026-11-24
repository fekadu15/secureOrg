import React, { useState, useEffect } from 'react';
import { auditApi } from '../services/api.js';
import { Badge } from '../components/Badge.js';
import { Modal } from '../components/Modal.js';
import { AuditEvent } from '../types/index.js';

export const AuditLogsPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected Event Details Modal
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  // Cryptographic Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    totalRecords: number;
    verifiedRecords: number;
    verifiedAt?: string;
    details?: string;
  } | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await auditApi.list({
        page,
        limit: 15,
        search: search || undefined,
        status: statusFilter || undefined
      });
      setEvents(res.events);
      setTotalPages(res.pagination.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleVerifyIntegrity = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      const res = await auditApi.verifyIntegrity();
      setVerificationResult(res);
    } catch (err: any) {
      setVerificationResult({
        isValid: false,
        totalRecords: 0,
        verifiedRecords: 0,
        details: err.message || 'Verification failure'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
            Cryptographic Audit Trail & Logs
          </h1>
          <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
            Tamper-evident append-only ledger protected by SHA-256 cryptographic hash-chaining.
          </p>
        </div>
        <button
          type="button"
          onClick={handleVerifyIntegrity}
          disabled={isVerifying}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-bold text-[13px] shadow-sm hover:bg-primary-container transition-colors disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${isVerifying ? 'animate-spin' : ''}`}>
            {isVerifying ? 'sync' : 'verified'}
          </span>
          <span>{isVerifying ? 'Verifying Hashes...' : 'Verify Hash-Chain Integrity'}</span>
        </button>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div
          className={`p-space-md rounded-2xl border flex items-start gap-space-sm shadow-sm transition-all ${
            verificationResult.isValid
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-error-container border-error/30 text-on-error-container'
          }`}
        >
          <span className="material-symbols-outlined text-[24px] flex-shrink-0 mt-0.5">
            {verificationResult.isValid ? 'verified' : 'gpp_bad'}
          </span>
          <div className="flex-1 text-[13px]">
            <strong className="block font-bold text-[14px]">
              {verificationResult.isValid
                ? 'Cryptographic Hash-Chain Integrity: VERIFIED COMPLIANT'
                : 'Integrity Verification: TAMPERING DETECTED'}
            </strong>
            <p className="mt-0.5 leading-relaxed">
              {verificationResult.isValid
                ? `All ${verificationResult.totalRecords} chronological audit records successfully verified against SHA-256 cryptographic hash chaining. No records have been modified, spliced, or deleted.`
                : verificationResult.details}
            </p>
            {verificationResult.verifiedAt && (
              <span className="text-[11px] opacity-80 block mt-1">
                Verified at: {new Date(verificationResult.verifiedAt).toLocaleString()}
              </span>
            )}
          </div>
          <button onClick={() => setVerificationResult(null)} className="p-1">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-wrap items-center justify-between gap-space-md">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative flex items-center">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-3">
            search
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, actor, resource..."
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-low text-on-surface text-[13px] border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-[13px] text-on-surface focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILURE">FAILURE</option>
          <option value="DENIED">DENIED</option>
        </select>
      </div>

      {/* Audit Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface-container-low/60 border-b border-outline-variant/30 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor Email</th>
                <th className="py-3 px-4">Event Action</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Cryptographic Hash</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                    <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading audit stream...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                    No matching audit records.
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-3 px-4 text-on-surface-variant text-[12px] whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-on-surface">{evt.actorEmail || 'SYSTEM'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-primary text-[12px]">{evt.action}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{evt.resource}</td>
                    <td className="py-3 px-4">
                      <Badge label={evt.status} variant={evt.status as any} />
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-on-surface-variant">{evt.ipAddress}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-secondary">
                      <span title={evt.eventHash}>{evt.eventHash.slice(0, 14)}...</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(evt)}
                        className="px-2.5 py-1 rounded bg-surface-container-low hover:bg-surface-container text-primary font-bold text-[11px] border border-outline-variant/30"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
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

      {/* Inspect Modal */}
      <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Audit Event Evidence Inspection">
        {selectedEvent && (
          <div className="space-y-space-md text-[13px]">
            <div className="grid grid-cols-2 gap-space-sm p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/30">
              <div>
                <strong className="text-on-surface-variant text-[11px] block uppercase">Event ID</strong>
                <span className="font-mono text-primary font-semibold">{selectedEvent.id}</span>
              </div>
              <div>
                <strong className="text-on-surface-variant text-[11px] block uppercase">Timestamp (UTC)</strong>
                <span>{new Date(selectedEvent.timestamp).toISOString()}</span>
              </div>
              <div>
                <strong className="text-on-surface-variant text-[11px] block uppercase">Actor</strong>
                <span>{selectedEvent.actorEmail || 'SYSTEM'}</span>
              </div>
              <div>
                <strong className="text-on-surface-variant text-[11px] block uppercase">Outcome Status</strong>
                <Badge label={selectedEvent.status} variant={selectedEvent.status as any} />
              </div>
            </div>

            <div className="p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-1">
              <strong className="text-on-surface-variant text-[11px] block uppercase">
                Cryptographic Linkage (Tamper-Evidence)
              </strong>
              <div className="text-[12px]">
                <span className="text-on-surface-variant">Previous Block Hash: </span>
                <code className="font-mono text-[11px] text-primary break-all block">{selectedEvent.previousHash}</code>
              </div>
              <div className="text-[12px] mt-1">
                <span className="text-on-surface-variant">Current Record Hash (SHA-256): </span>
                <code className="font-mono text-[11px] text-secondary font-bold break-all block">{selectedEvent.eventHash}</code>
              </div>
            </div>

            <div>
              <strong className="text-on-surface-variant text-[11px] block uppercase mb-1">
                Metadata Payload
              </strong>
              <pre className="p-3 rounded-xl bg-surface-container font-mono text-[12px] text-primary overflow-x-auto max-h-48 border border-outline-variant/30">
                {JSON.stringify(selectedEvent.metadata || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
