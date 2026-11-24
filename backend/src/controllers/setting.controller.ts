import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AuditService } from '../services/audit.service.js';
import { AccountStatus, AlertStatus, RequestStatus } from '@prisma/client';

const updateSettingSchema = z.object({
  key: z.string(),
  value: z.string()
});

export class SettingController {
  /**
   * List System Settings
   */
  static async listSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' }
    });

    res.status(200).json({ success: true, data: { settings } });
  }

  /**
   * Update System Setting
   */
  static async updateSetting(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { key, value } = updateSettingSchema.parse(req.body);

    const existing = await prisma.systemSetting.findUnique({ where: { key } });
    const previousValue = existing ? existing.value : null;

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, updatedBy: req.user?.email },
      create: { key, value, updatedBy: req.user?.email }
    });

    await AuditService.log({
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      action: 'SYSTEM_SETTING_CHANGED',
      resource: 'SYSTEM_SETTING',
      resourceId: key,
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { key, previousValue, newValue: value }
    });

    res.status(200).json({
      success: true,
      data: { message: `System setting "${key}" updated.`, setting }
    });
  }

  /**
   * High-Level Security Operations Dashboard Stats (FR-MON-03)
   */
  static async getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      pendingRoleRequests,
      unresolvedAlerts,
      recentAlerts,
      recentAuditEvents
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: AccountStatus.ACTIVE } }),
      prisma.user.count({ where: { status: { in: [AccountStatus.SUSPENDED, AccountStatus.LOCKED] } } }),
      prisma.roleChangeRequest.count({ where: { status: RequestStatus.PENDING } }),
      prisma.securityAlert.count({ where: { status: { in: [AlertStatus.NEW, AlertStatus.INVESTIGATING, AlertStatus.ACKNOWLEDGED] } } }),
      prisma.securityAlert.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditEvent.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          totalUsers,
          activeUsers,
          suspendedUsers,
          pendingRoleRequests,
          unresolvedAlerts,
          activeGateways: 14,
          complianceScore: '98.4%',
          systemStatus: 'OPERATIONAL'
        },
        recentAlerts,
        recentAuditEvents
      }
    });
  }

  /**
   * List Organizational Units
   */
  static async listUnits(req: AuthenticatedRequest, res: Response): Promise<void> {
    const units = await prisma.organizationalUnit.findMany({
      include: {
        _count: { select: { users: true } }
      },
      orderBy: { name: 'asc' }
    });

    res.status(200).json({ success: true, data: { units } });
  }
}
