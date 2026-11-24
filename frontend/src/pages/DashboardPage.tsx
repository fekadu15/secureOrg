import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { systemApi } from '../services/api.js';
import { StatCard } from '../components/StatCard.js';
import { Badge } from '../components/Badge.js';
import { DashboardStats } from '../types/index.js';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const stats = await systemApi.getDashboardStats();
      setData(stats);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSync = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
        <span className="font-label-md text-on-surface-variant text-[13px]">
          Aggregating Security Operations Telemetry...
        </span>
      </div>
    );
  }

  const kpi = data?.kpi || {
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    pendingRoleRequests: 0,
    unresolvedAlerts: 0,
    activeGateways: 14,
    complianceScore: '98.4%',
    systemStatus: 'OPERATIONAL'
  };

  return (
    <div className="space-y-space-lg">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-space-sm">
            <span className="font-label-sm text-[11px] font-bold uppercase text-secondary tracking-wider">
              01 / Security Posture
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-[11px] font-semibold border border-outline-variant/30">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              Live Database Connected
            </span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
            Security Operations Overview
          </h1>
        </div>
        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            onClick={handleSync}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-[13px] font-semibold border border-outline-variant/40 shadow-sm hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isRefreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
          </button>
          <Link
            to="/alerts"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-lg text-[13px] font-bold shadow-sm hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">shield</span>
            <span>Threat Console</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-md">
        <StatCard
          title="Total Users"
          value={kpi.totalUsers}
          icon="group"
          badgeText="Catalog"
          badgeType="secondary"
        />
        <StatCard
          title="Active Users"
          value={kpi.activeUsers}
          icon="verified_user"
          badgeText={`${kpi.totalUsers ? Math.round((kpi.activeUsers / kpi.totalUsers) * 100) : 100}%`}
          badgeType="success"
        />
        <StatCard
          title="Suspended / Locked"
          value={kpi.suspendedUsers}
          icon="person_off"
          badgeText={kpi.suspendedUsers > 0 ? 'Action Req' : 'Clean'}
          badgeType={kpi.suspendedUsers > 0 ? 'error' : 'secondary'}
        />
        <StatCard
          title="Pending Role Requests"
          value={kpi.pendingRoleRequests}
          icon="assignment_ind"
          badgeText={kpi.pendingRoleRequests > 0 ? 'Awaiting Review' : '0 Pending'}
          badgeType="warning"
        />
        <StatCard
          title="Unresolved Alerts"
          value={kpi.unresolvedAlerts}
          icon="notifications_active"
          badgeText={kpi.unresolvedAlerts > 0 ? 'High Priority' : 'All Clear'}
          badgeType={kpi.unresolvedAlerts > 0 ? 'error' : 'success'}
        />
        <StatCard
          title="System Gateways"
          value={kpi.activeGateways}
          icon="cloud_done"
          badgeText="Zero-Trust"
          badgeType="primary"
        />
      </section>

      {/* Two-Column Telemetry & Operational Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        {/* Recent Security Alerts */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-space-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-space-md">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">security</span>
                <h3 className="font-title-md text-title-md text-on-surface font-bold">Recent Security Alerts</h3>
              </div>
              <Link to="/alerts" className="text-secondary text-[13px] font-semibold hover:underline">
                View all &rarr;
              </Link>
            </div>

            <div className="divide-y divide-outline-variant/20">
              {data?.recentAlerts && data.recentAlerts.length > 0 ? (
                data.recentAlerts.map((alert) => (
                  <div key={alert.id} className="py-3 flex items-start justify-between gap-space-sm">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-on-surface">{alert.title}</span>
                      <span className="text-[12px] text-on-surface-variant line-clamp-1">{alert.description}</span>
                      <span className="text-[11px] text-on-surface-variant/70 mt-1">
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge label={alert.severity} variant={alert.severity as any} />
                      <span className="text-[11px] font-medium text-on-surface-variant uppercase">{alert.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-on-surface-variant text-[13px]">
                  No active security alerts recorded.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/20 mt-4 flex justify-end">
            <Link
              to="/alerts"
              className="text-[12px] font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1"
            >
              <span>Threat console triage</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Cryptographic Audit Trail */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-space-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-space-md">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">history</span>
                <h3 className="font-title-md text-title-md text-on-surface font-bold">
                  Tamper-Evident Audit Ticker
                </h3>
              </div>
              <Link to="/audit-logs" className="text-secondary text-[13px] font-semibold hover:underline">
                View all &rarr;
              </Link>
            </div>

            <div className="divide-y divide-outline-variant/20">
              {data?.recentAuditEvents && data.recentAuditEvents.length > 0 ? (
                data.recentAuditEvents.map((evt) => (
                  <div key={evt.id} className="py-3 flex items-start justify-between gap-space-sm">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] font-bold text-primary truncate">{evt.action}</span>
                        <Badge label={evt.status} variant={evt.status as any} />
                      </div>
                      <span className="text-[12px] text-on-surface-variant truncate">
                        Actor: {evt.actorEmail || 'SYSTEM'} &bull; IP: {evt.ipAddress}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] font-mono text-on-surface-variant/70">Hash:</span>
                        <span className="text-[10px] font-mono text-secondary truncate max-w-[200px]" title={evt.eventHash}>
                          {evt.eventHash.slice(0, 16)}...
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-on-surface-variant/70 flex-shrink-0">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-on-surface-variant text-[13px]">
                  No audit events recorded yet.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/20 mt-4 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">link</span>
              <span>SHA-256 Chained</span>
            </span>
            <Link
              to="/audit-logs"
              className="text-[12px] font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1"
            >
              <span>Verify cryptographic chain integrity</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
