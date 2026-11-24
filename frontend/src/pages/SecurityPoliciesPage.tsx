import React, { useState, useEffect } from 'react';
import { policiesApi } from '../services/api.js';
import { Modal } from '../components/Modal.js';
import { Policy } from '../types/index.js';

export const SecurityPoliciesPage: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Policy Reader / Acknowledge Modal
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchPolicies = async () => {
    setIsLoading(true);
    try {
      const res = await policiesApi.list();
      setPolicies(res.policies);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleAcknowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy || !hasAgreed) return;
    setIsAcknowledging(true);
    try {
      const res = await policiesApi.acknowledge(selectedPolicy.id);
      setNotification({ message: res.message, type: 'success' });
      setSelectedPolicy(null);
      setHasAgreed(false);
      fetchPolicies();
    } catch (err: any) {
      setNotification({ message: err.message || 'Error acknowledging policy', type: 'error' });
    } finally {
      setIsAcknowledging(false);
    }
  };

  return (
    <div className="space-y-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
            Security Policies & Digital Acknowledgements
          </h1>
          <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
            Organizational security governance, acceptable use compliance, and cryptographic employee acknowledgement records.
          </p>
        </div>
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

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        {isLoading ? (
          <div className="col-span-full py-16 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          policies.map((pol) => (
            <div
              key={pol.id}
              className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-space-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold bg-primary-fixed text-on-primary-fixed-variant px-2.5 py-0.5 rounded-full">
                      {pol.code}
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-semibold">v{pol.version}</span>
                  </div>
                  {pol.isAcknowledgedByMe ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      <span>Acknowledged</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-300">
                      <span className="material-symbols-outlined text-[14px]">pending</span>
                      <span>Action Required</span>
                    </span>
                  )}
                </div>

                <h3 className="font-title-md text-title-md text-on-surface font-bold mt-2">{pol.title}</h3>
                <span className="text-[11px] text-secondary font-bold uppercase tracking-wider block mt-0.5">
                  Category: {pol.category}
                </span>

                <p className="font-body-sm text-[13px] text-on-surface-variant mt-2 line-clamp-3 leading-relaxed">
                  {pol.content}
                </p>
              </div>

              <div className="mt-space-md pt-space-sm border-t border-outline-variant/20 flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant">
                  {pol.totalAcknowledgements} Signatures Recorded
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPolicy(pol);
                    setHasAgreed(pol.isAcknowledgedByMe);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-bold text-[12px] border border-outline-variant/30 transition-colors"
                >
                  {pol.isAcknowledgedByMe ? 'Review Policy' : 'Read & Acknowledge'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Policy Reader Modal */}
      <Modal
        isOpen={!!selectedPolicy}
        onClose={() => setSelectedPolicy(null)}
        title={selectedPolicy ? `${selectedPolicy.code}: ${selectedPolicy.title}` : ''}
        maxWidth="max-w-2xl"
      >
        {selectedPolicy && (
          <form onSubmit={handleAcknowledge} className="space-y-space-md text-[13px]">
            <div className="flex items-center gap-space-sm text-[12px] text-on-surface-variant border-b border-outline-variant/20 pb-2">
              <span>Category: <strong>{selectedPolicy.category}</strong></span>
              <span>&bull;</span>
              <span>Version: <strong>{selectedPolicy.version}</strong></span>
              <span>&bull;</span>
              <span>Status: <strong>{selectedPolicy.status}</strong></span>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 leading-relaxed max-h-72 overflow-y-auto text-on-surface whitespace-pre-wrap">
              {selectedPolicy.content}
            </div>

            {selectedPolicy.isAcknowledgedByMe ? (
              <div className="p-space-sm rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-[12px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-700">verified</span>
                <span>
                  You digitally acknowledged this policy version on{' '}
                  {new Date(selectedPolicy.acknowledgedAt || '').toLocaleString()}.
                </span>
              </div>
            ) : (
              <div className="p-space-sm rounded-xl bg-surface-container border border-outline-variant/30">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-0 cursor-pointer accent-primary"
                  />
                  <span className="text-[12px] text-on-surface leading-tight">
                    I acknowledge that I have read, understood, and agreed to adhere to this security policy. My digital signature and IP address will be recorded into the cryptographic audit trail.
                  </span>
                </label>
              </div>
            )}

            <div className="flex justify-end gap-space-sm pt-space-sm border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setSelectedPolicy(null)}
                className="px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface hover:bg-surface-container"
              >
                Close
              </button>
              {!selectedPolicy.isAcknowledgedByMe && (
                <button
                  type="submit"
                  disabled={!hasAgreed || isAcknowledging}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-bold hover:bg-primary-container disabled:opacity-50"
                >
                  {isAcknowledging ? 'Recording Signature...' : 'Submit Digital Acknowledgement'}
                </button>
              )}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
