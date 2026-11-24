import React, { useState, useEffect } from 'react';
import { risksApi } from '../services/api.js';
import { Modal } from '../components/Modal.js';
import { Risk } from '../types/index.js';

export const RiskRegisterPage: React.FC = () => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Risk Modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Access Control');
  const [description, setDescription] = useState('');
  const [likelihood, setLikelihood] = useState(3);
  const [impact, setImpact] = useState(3);
  const [owner, setOwner] = useState('');
  const [treatmentStrategy, setTreatmentStrategy] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchRisks = async () => {
    setIsLoading(true);
    try {
      const res = await risksApi.list();
      setRisks(res.risks);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await risksApi.create({
        title,
        category,
        description,
        likelihood: Number(likelihood),
        impact: Number(impact),
        owner: owner || undefined,
        treatmentStrategy: treatmentStrategy || undefined
      });

      setNewModalOpen(false);
      setTitle('');
      setDescription('');
      fetchRisks();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 15) return 'bg-error-container text-on-error-container border-error/30';
    if (score >= 8) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  };

  return (
    <div className="space-y-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
            Governance Risk Register
          </h1>
          <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
            Identify, assess, and treat organizational security vulnerabilities and cyber risks.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-bold text-[13px] shadow-sm hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add_moderator</span>
          <span>Register New Risk</span>
        </button>
      </div>

      {/* Risks Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface-container-low/60 border-b border-outline-variant/30 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3 px-4">Risk Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Likelihood (1-5)</th>
                <th className="py-3 px-4 text-center">Impact (1-5)</th>
                <th className="py-3 px-4 text-center">Risk Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Treatment Strategy</th>
                <th className="py-3 px-4">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                    <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading risks...
                  </td>
                </tr>
              ) : risks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                    No registered risks found.
                  </td>
                </tr>
              ) : (
                risks.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-on-surface">
                      <div>{r.title}</div>
                      <span className="text-[11px] text-on-surface-variant font-normal line-clamp-1">{r.description}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-on-surface-variant">{r.category}</td>
                    <td className="py-3 px-4 text-center font-bold text-on-surface">{r.likelihood}</td>
                    <td className="py-3 px-4 text-center font-bold text-on-surface">{r.impact}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-bold border ${getScoreBadge(r.riskScore)}`}>
                        {r.riskScore} / 25
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-bold text-secondary uppercase bg-secondary-fixed/40 px-2 py-0.5 rounded-full">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant max-w-xs line-clamp-2">
                      {r.treatmentStrategy || 'Standard baseline controls'}
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant text-[12px]">{r.owner || 'Unassigned'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register New Risk Modal */}
      <Modal isOpen={newModalOpen} onClose={() => setNewModalOpen(false)} title="Register Security Risk">
        <form onSubmit={handleCreate} className="space-y-space-md text-[13px]">
          <div className="flex flex-col space-y-1">
            <label className="text-[12px] font-semibold text-on-surface">Risk Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unauthenticated API access due to misconfigured route guards"
              className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[12px] font-semibold text-on-surface">Category</label>
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Access Control, Cryptography, Supply Chain"
              className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col space-y-1">
              <label className="text-[12px] font-semibold text-on-surface">Likelihood (1 - Rare to 5 - Almost Certain)</label>
              <input
                type="number"
                min={1}
                max={5}
                required
                value={likelihood}
                onChange={(e) => setLikelihood(Number(e.target.value))}
                className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[12px] font-semibold text-on-surface">Impact (1 - Negligible to 5 - Catastrophic)</label>
              <input
                type="number"
                min={1}
                max={5}
                required
                value={impact}
                onChange={(e) => setImpact(Number(e.target.value))}
                className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[12px] font-semibold text-on-surface">Risk Narrative & Consequences</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain how this threat materializes and the organizational impact..."
              className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[12px] font-semibold text-on-surface">Treatment Strategy & Mitigating Controls</label>
            <textarea
              rows={2}
              value={treatmentStrategy}
              onChange={(e) => setTreatmentStrategy(e.target.value)}
              placeholder="Document server-side controls, MFA enforcement, rate limits..."
              className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-space-sm pt-space-sm border-t border-outline-variant/30">
            <button
              type="button"
              onClick={() => setNewModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary font-bold hover:bg-primary-container disabled:opacity-50"
            >
              {isCreating ? 'Registering...' : 'Add to Risk Register'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
