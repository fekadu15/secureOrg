import React, { useState, useEffect } from 'react';
import { rolesApi, usersApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Badge } from '../components/Badge.js';
import { Modal } from '../components/Modal.js';
import { RoleChangeRequest, User, Role } from '../types/index.js';

export const RoleRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RoleChangeRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Submit Modal
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [requestedRoleId, setRequestedRoleId] = useState('');
  const [justification, setJustification] = useState('');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RoleChangeRequest | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [decisionReason, setDecisionReason] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await rolesApi.listRequests();
      setRequests(res.requests);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    usersApi.list({ limit: 50 }).then((res) => {
      if (res?.users) {
        setUsers(res.users);
        if (res.users.length > 0) setTargetUserId(res.users[0].id);
      }
    });
    rolesApi.list().then((res) => {
      if (res?.roles) {
        setRoles(res.roles);
        if (res.roles.length > 0) setRequestedRoleId(res.roles[0].id);
      }
    });
  }, []);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await rolesApi.createRequest({
        targetUserId,
        roleId: requestedRoleId,
        justification,
        durationDays: Number(durationDays) || undefined
      });

      setNotification({
        message: 'Role change request submitted for independent approver review.',
        type: 'success'
      });
      setSubmitModalOpen(false);
      setJustification('');
      fetchRequests();
    } catch (err: any) {
      setNotification({ message: err.message || 'Error submitting request', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setIsReviewing(true);
    try {
      await rolesApi.reviewRequest(selectedRequest.id, {
        status: reviewDecision,
        decisionReason
      });

      setNotification({
        message: `Role request ${reviewDecision.toLowerCase()} successfully.`,
        type: 'success'
      });
      setReviewModalOpen(false);
      setDecisionReason('');
      fetchRequests();
    } catch (err: any) {
      setNotification({ message: err.message || 'Separation of duties violation or error', type: 'error' });
    } finally {
      setIsReviewing(false);
    }
  };

  const isSelfApproval = (req: RoleChangeRequest) => {
    return user?.id === req.requesterId || user?.id === req.targetUserId;
  };

  return (
    <div className="space-y-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
            Role Change Requests & Approvals
          </h1>
          <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
            Strict separation of duties workflow: dynamic role elevation requires independent security officer review.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSubmitModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-bold text-[13px] shadow-sm hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">assignment_add</span>
          <span>Submit Role Change Request</span>
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

      {/* Separation of Duties Policy Banner */}
      <div className="p-space-md rounded-xl bg-surface-container-low border border-secondary-container flex items-start gap-space-sm">
        <span className="material-symbols-outlined text-secondary text-[22px] flex-shrink-0 mt-0.5">
          policy
        </span>
        <div className="text-[12px] text-on-surface-variant leading-relaxed">
          <strong className="text-on-surface block font-bold text-[13px]">
            Security Control 1.1 / Separation of Duties Enforced:
          </strong>
          No user can approve their own role change request, nor can any user approve an elevation request for which they are the target. All self-approval attempts are intercepted, blocked, and recorded as critical security events.
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface-container-low/60 border-b border-outline-variant/30 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3 px-4">Target User</th>
                <th className="py-3 px-4">Requested Role</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4">Business Justification</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    No role change requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const selfApprovalBlocked = isSelfApproval(req);

                  return (
                    <tr key={req.id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-on-surface block">{req.targetUser.fullName}</span>
                        <span className="text-[11px] text-on-surface-variant">{req.targetUser.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-primary">
                          <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                          {req.role.displayName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant">
                        <span>{req.requester.fullName}</span>
                      </td>
                      <td className="py-3 px-4 max-w-xs text-on-surface-variant line-clamp-2">
                        {req.justification}
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant font-medium">
                        {req.durationDays ? `${req.durationDays} Days` : 'Permanent'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge label={req.status} variant={req.status as any} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {req.status === 'PENDING' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRequest(req);
                              setReviewModalOpen(true);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                              selfApprovalBlocked
                                ? 'bg-error-container text-on-error-container border-error/30 hover:bg-error/20'
                                : 'bg-primary text-on-primary hover:bg-primary-container'
                            }`}
                          >
                            {selfApprovalBlocked ? 'Self-Review (Blocked)' : 'Review Request'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-on-surface-variant/70 italic">
                            Decided by {req.approver?.fullName || 'System'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Request Modal */}
      <Modal isOpen={submitModalOpen} onClose={() => setSubmitModalOpen(false)} title="Submit Role Change Request">
        <form onSubmit={handleSubmitRequest} className="space-y-space-md">
          <div className="flex flex-col space-y-1">
            <label className="text-[12px] font-semibold text-on-surface">Target User</label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-[13px] text-on-surface focus:outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[12px] font-semibold text-on-surface">Requested Role</label>
            <select
              value={requestedRoleId}
              onChange={(e) => setRequestedRoleId(e.target.value)}
              className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-[13px] text-on-surface focus:outline-none"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.displayName} {r.isPrivileged ? '(Privileged)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[12px] font-semibold text-on-surface">Duration (Days)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              placeholder="Leave empty for permanent assignment"
              className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-[13px] text-on-surface focus:outline-none"
            />
            <span className="text-[11px] text-on-surface-variant">Recommended: 30 days for temporary elevation</span>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[12px] font-semibold text-on-surface">Business Justification (Audited)</label>
            <textarea
              required
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="State the formal organizational necessity for this privilege grant..."
              className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-[13px] text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div className="flex justify-end gap-space-sm pt-space-sm border-t border-outline-variant/30">
            <button
              type="button"
              onClick={() => setSubmitModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-outline-variant/40 text-[13px] font-semibold text-on-surface hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary font-bold text-[13px] hover:bg-primary-container disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title="Independent Approver Review">
        {selectedRequest && (
          <form onSubmit={handleReviewRequest} className="space-y-space-md">
            {/* Warning if self-approval */}
            {isSelfApproval(selectedRequest) && (
              <div className="p-space-sm rounded-lg bg-error-container text-on-error-container border border-error/30 text-[12px] flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] flex-shrink-0">warning</span>
                <div>
                  <strong className="block font-bold">Separation of Duties Alert:</strong>
                  You are the requester or target user for this request. Server security policy strictly prohibits approving your own role change.
                </div>
              </div>
            )}

            <div className="p-space-sm rounded-lg bg-surface-container-low text-[13px] space-y-1">
              <div>
                <strong>Target User:</strong> {selectedRequest.targetUser.fullName} ({selectedRequest.targetUser.email})
              </div>
              <div>
                <strong>Requested Role:</strong> {selectedRequest.role.displayName}
              </div>
              <div>
                <strong>Submitted By:</strong> {selectedRequest.requester.fullName}
              </div>
              <div>
                <strong>Justification:</strong> {selectedRequest.justification}
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[12px] font-semibold text-on-surface">Decision</label>
              <div className="grid grid-cols-2 gap-space-sm">
                <button
                  type="button"
                  onClick={() => setReviewDecision('APPROVED')}
                  className={`py-2 rounded-lg font-bold text-[13px] border transition-colors ${
                    reviewDecision === 'APPROVED'
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                      : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'
                  }`}
                >
                  Approve Role Change
                </button>
                <button
                  type="button"
                  onClick={() => setReviewDecision('REJECTED')}
                  className={`py-2 rounded-lg font-bold text-[13px] border transition-colors ${
                    reviewDecision === 'REJECTED'
                      ? 'bg-error-container border-error/40 text-on-error-container'
                      : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'
                  }`}
                >
                  Reject Request
                </button>
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[12px] font-semibold text-on-surface">Decision Comment (Audited)</label>
              <textarea
                required
                rows={3}
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="Document your decision justification..."
                className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-[13px] text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            <div className="flex justify-end gap-space-sm pt-space-sm border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-outline-variant/40 text-[13px] font-semibold text-on-surface hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isReviewing}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-bold text-[13px] hover:bg-primary-container disabled:opacity-50"
              >
                {isReviewing ? 'Processing Decision...' : 'Record Decision'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
