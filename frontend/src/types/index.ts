export type AccountStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'DEACTIVATED';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'NEW' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
export type IncidentStatus = 'REPORTED' | 'TRIAGED' | 'CONTAINMENT' | 'ERADICATION' | 'RECOVERY' | 'POST_INCIDENT_REVIEW' | 'CLOSED';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  status: AccountStatus;
  mfaEnabled: boolean;
  unitId?: string | null;
  unit?: { id: string; name: string; code: string } | null;
  roles?: string[];
  permissions?: string[];
  userRoles?: {
    assignedAt: string;
    expiresAt?: string | null;
    role: { id: string; name: string; displayName: string; isPrivileged: boolean };
  }[];
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isPrivileged: boolean;
  userCount?: number;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
  description?: string;
}

export interface RoleChangeRequest {
  id: string;
  requesterId: string;
  targetUserId: string;
  roleId: string;
  justification: string;
  durationDays?: number | null;
  status: RequestStatus;
  approverId?: string | null;
  decisionReason?: string | null;
  decisionAt?: string | null;
  createdAt: string;
  requester: { id: string; email: string; fullName: string };
  targetUser: { id: string; email: string; fullName: string };
  role: { id: string; name: string; displayName: string; isPrivileged: boolean };
  approver?: { id: string; email: string; fullName: string } | null;
}

export interface AuditEvent {
  id: string;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  status: 'SUCCESS' | 'FAILURE' | 'DENIED';
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  previousHash: string;
  eventHash: string;
  timestamp: string;
  actor?: { id: string; email: string; fullName: string } | null;
}

export interface SecurityAlert {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  status: AlertStatus;
  assigneeId?: string | null;
  sourceEventId?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  assignee?: { id: string; email: string; fullName: string } | null;
}

export interface BackupRecord {
  id: string;
  filename: string;
  backupType: 'FULL' | 'INCREMENTAL';
  fileSize: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  checksum?: string | null;
  storagePath: string;
  encryptionMethod: string;
  restoredAt?: string | null;
  restoreStatus?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface Incident {
  id: string;
  trackingNumber: string;
  title: string;
  category: string;
  severity: AlertSeverity;
  status: IncidentStatus;
  reporterId: string;
  assigneeId?: string | null;
  description: string;
  containmentNotes?: string | null;
  eradicationNotes?: string | null;
  recoveryNotes?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  closedAt?: string | null;
  reporter: { id: string; email: string; fullName: string };
  assignee?: { id: string; email: string; fullName: string } | null;
}

export interface Risk {
  id: string;
  title: string;
  category: string;
  description: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  status: string;
  owner?: string | null;
  treatmentStrategy?: string | null;
  reviewDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Policy {
  id: string;
  title: string;
  code: string;
  version: string;
  category: string;
  content: string;
  status: string;
  publishedAt: string;
  isAcknowledgedByMe: boolean;
  acknowledgedAt?: string | null;
  totalAcknowledgements: number;
}

export interface OrganizationalUnit {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  _count?: { users: number };
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  description?: string | null;
  updatedBy?: string | null;
  updatedAt: string;
}

export interface DashboardStats {
  kpi: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    pendingRoleRequests: number;
    unresolvedAlerts: number;
    activeGateways: number;
    complianceScore: string;
    systemStatus: string;
  };
  recentAlerts: SecurityAlert[];
  recentAuditEvents: AuditEvent[];
}
