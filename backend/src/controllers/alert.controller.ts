import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AuditService } from '../services/audit.service.js';
import { AlertSeverity, AlertStatus } from '@prisma/client';

const updateAlertStatusSchema = z.object({
  status: z.nativeEnum(AlertStatus),
  resolutionNotes: z.string().optional(),
  assigneeId: z.string().optional()
});

export class AlertController {
  /**
   * List Security Alerts
   */
  static async listAlerts(req: AuthenticatedRequest, res: Response): Promise<void> {
    const status = req.query.status as AlertStatus | undefined;
    const severity = req.query.severity as AlertSeverity | undefined;

    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const alerts = await prisma.securityAlert.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, email: true, fullName: true }
        }
      },
      orderBy: [{ createdAt: 'desc' }]
    });

    res.status(200).json({ success: true, data: { alerts } });
  }

  /**
   * Update Alert Status / Investigate / Resolve
   */
  static async updateAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const data = updateAlertStatusSchema.parse(req.body);

    const alert = await prisma.securityAlert.findUnique({ where: { id } });
    if (!alert) {
      res.status(404).json({ success: false, error: { message: 'Alert not found' } });
      return;
    }

    const updatePayload: any = {
      status: data.status,
      resolutionNotes: data.resolutionNotes !== undefined ? data.resolutionNotes : alert.resolutionNotes
    };

    if (data.assigneeId !== undefined) {
      updatePayload.assigneeId = data.assigneeId || null;
    }

    if (data.status === AlertStatus.RESOLVED) {
      updatePayload.resolvedAt = new Date();
    }

    const updated = await prisma.securityAlert.update({
      where: { id },
      data: updatePayload
    });

    await AuditService.log({
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      action: `ALERT_STATUS_${data.status}`,
      resource: 'ALERT',
      resourceId: id,
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { previousStatus: alert.status, newStatus: data.status }
    });

    res.status(200).json({
      success: true,
      data: { message: `Alert status updated to ${data.status}.`, alert: updated }
    });
  }
}
