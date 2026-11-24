const API_BASE = '/api/v1';

export class ApiError extends Error {
  code?: string;
  details?: any;
  status: number;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = localStorage.getItem('accessToken');
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  const contentType = response.headers.get('content-type');
  let data: any = {};
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMsg = data?.error?.message || response.statusText || 'Request failed';
    throw new ApiError(errorMsg, response.status, data?.error?.code, data?.error?.details);
  }

  return data.data;
}

export const api = {
  get: <T>(endpoint: string, headers?: HeadersInit) => request<T>(endpoint, { method: 'GET', headers }),
  post: <T>(endpoint: string, body?: any, headers?: HeadersInit) =>
    request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined, headers }),
  put: <T>(endpoint: string, body?: any, headers?: HeadersInit) =>
    request<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, headers }),
  delete: <T>(endpoint: string, headers?: HeadersInit) => request<T>(endpoint, { method: 'DELETE', headers })
};

export const authApi = {
  login: (credentials: { email: string; password: string }) => api.post<any>('/auth/login', credentials),
  register: (payload: any) => api.post<any>('/auth/register', payload),
  verifyEmail: (payload: { email: string; token: string }) => api.post<any>('/auth/verify-email', payload),
  verifyMfa: (payload: { email: string; tempToken: string; code: string; isRecoveryCode?: boolean }) =>
    api.post<any>('/auth/verify-mfa', payload),
  initiateMfaEnrollment: () => api.post<any>('/auth/mfa/enroll'),
  confirmMfaEnrollment: (payload: { secret: string; verificationCode: string }) =>
    api.post<any>('/auth/mfa/confirm', payload),
  forgotPassword: (email: string) => api.post<any>('/auth/forgot-password', { email }),
  resetPassword: (payload: { token: string; newPassword: string }) => api.post<any>('/auth/reset-password', payload),
  logout: () => api.post<any>('/auth/logout'),
  getMe: () => api.get<any>('/auth/me'),
  refreshToken: () => api.post<any>('/auth/refresh-token')
};

export const usersApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string; unitId?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.unitId) query.append('unitId', params.unitId);
    return api.get<{ users: any[]; pagination: any }>(`/users?${query.toString()}`);
  },
  getById: (id: string) => api.get<{ user: any }>(`/users/${id}`),
  create: (data: any) => api.post<any>('/users', data),
  updateStatus: (id: string, payload: { status: string; reason: string }) =>
    api.put<any>(`/users/${id}/status`, payload),
  updateProfile: (data: any) => api.put<any>('/users/profile', data)
};

export const rolesApi = {
  list: () => api.get<{ roles: any[] }>('/roles'),
  listPermissions: () => api.get<{ permissions: any[] }>('/roles/permissions'),
  listRequests: (status?: string) =>
    api.get<{ requests: any[] }>(`/roles/requests${status ? `?status=${status}` : ''}`),
  createRequest: (data: { targetUserId: string; roleId: string; justification: string; durationDays?: number }) =>
    api.post<any>('/roles/requests', data),
  reviewRequest: (id: string, payload: { status: 'APPROVED' | 'REJECTED'; decisionReason: string }) =>
    api.post<any>(`/roles/requests/${id}/review`, payload)
};

export const auditApi = {
  list: (params?: { page?: number; limit?: number; action?: string; search?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.action) query.append('action', params.action);
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    return api.get<{ events: any[]; pagination: any }>(`/audit?${query.toString()}`);
  },
  verifyIntegrity: () => api.post<any>('/audit/verify-integrity')
};

export const alertsApi = {
  list: (params?: { status?: string; severity?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.severity) query.append('severity', params.severity);
    return api.get<{ alerts: any[] }>(`/alerts?${query.toString()}`);
  },
  update: (id: string, payload: { status: string; resolutionNotes?: string; assigneeId?: string }) =>
    api.put<any>(`/alerts/${id}`, payload)
};

export const backupsApi = {
  list: () => api.get<{ backups: any[] }>('/backups'),
  trigger: (payload: { backupType: 'FULL' | 'INCREMENTAL'; notes?: string }) =>
    api.post<any>('/backups/trigger', payload),
  restoreDrill: (backupId: string) => api.post<any>('/backups/restore-drill', { backupId })
};

export const incidentsApi = {
  list: (params?: { status?: string; severity?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.severity) query.append('severity', params.severity);
    return api.get<{ incidents: any[] }>(`/incidents?${query.toString()}`);
  },
  create: (data: { title: string; category: string; severity: string; description: string }) =>
    api.post<any>('/incidents', data),
  update: (id: string, payload: any) => api.put<any>(`/incidents/${id}`, payload)
};

export const risksApi = {
  list: () => api.get<{ risks: any[] }>('/risks'),
  create: (data: any) => api.post<any>('/risks', data),
  update: (id: string, data: any) => api.put<any>(`/risks/${id}`, data)
};

export const policiesApi = {
  list: () => api.get<{ policies: any[] }>('/policies'),
  create: (data: any) => api.post<any>('/policies', data),
  acknowledge: (id: string) => api.post<any>(`/policies/${id}/acknowledge`)
};

export const systemApi = {
  getDashboardStats: () => api.get<any>('/system/dashboard-stats'),
  listUnits: () => api.get<{ units: any[] }>('/system/units'),
  listSettings: () => api.get<{ settings: any[] }>('/system'),
  updateSetting: (key: string, value: string) => api.put<any>('/system', { key, value })
};
