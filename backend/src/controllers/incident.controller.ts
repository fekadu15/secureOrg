import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AuditService } from '../services/audit.service.js';
import { AlertSeverity, IncidentStatus } from '@prisma/client';

const createIncidentSchema = z.object({
  title: z.string().min(3),
  category: z.string().min(2),
  severity: z.nativeEnum(AlertSeverity).default(AlertSeverity.MEDIUM),
  description: z.string().min(10)
});

const updateIncidentSchema = z.object({
  status: z.nativeEnum(IncidentStatus).optional(),
  severity: z.nativeEnum(AlertSeverity).optional(),
  assigneeId: z.string().optional(),
  containmentNotes: z.string().optional(),
  eradicationNotes: z.string().optional(),
  recoveryNotes: z.string().optional(),
  reviewNotes: z.string().optional()
});

export class IncidentController {
  /**
   * List Incidents
   */
  static async listIncidents(req: AuthenticatedRequest, res: Response): Promise<void> {
    const status = req.query.status as IncidentStatus | undefined;
    const severity = req.query.severity as AlertSeverity | undefined;

    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    // Regular employee can only view incidents they reported
    if (req.user?.roles.includes('EMPLOYEE') && !req.user?.roles.includes('ADMIN') && !req.user?.roles.includes('SECURITY_OFFICER')) {
      where.reporterId = req.user.id;
    }

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        reporter: { select: { id: true, email: true, fullName: true } },
        assignee: { select: { id: true, email: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: { incidents } });
  }

  /**
   * Report an Incident
   */
  static async createIncident(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }

    const data = createIncidentSchema.parse(req.body);
    const trackingNumber = `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const incident = await prisma.incident.create({
      data: {
        trackingNumber,
        title: data.title,
        category: data.category,
        severity: data.severity,
        description: data.description,
        reporterId: req.user.id,
        status: IncidentStatus.REPORTED
      }
    });

    await AuditService.log({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'INCIDENT_REPORTED',
      resource: 'INCIDENT',
      resourceId: incident.id,
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { trackingNumber, severity: data.severity, title: data.title }
    });

    res.status(201).json({
      success: true,
      data: {
        message: 'Security incident registered. SOC triage initiated.',
        incident
      }
    });
  }

  /**
   * Update Incident Lifecycle & Remediation Stages
   */
  static async updateIncident(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const data = updateIncidentSchema.parse(req.body);

    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) {
      res.status(404).json({ success: false, error: { message: 'Incident not found' } });
      return;
    }

    const updatePayload: any = { ...data };
    if (data.status === IncidentStatus.CLOSED) {
      updatePayload.closedAt = new Date();
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: updatePayload
    });

    await AuditService.log({
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      action: `INCIDENT_UPDATED_${data.status || 'STAGE'}`,
      resource: 'INCIDENT',
      resourceId: id,
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { previousStatus: incident.status, newStatus: data.status, trackingNumber: incident.trackingNumber }
    });

    res.status(200).json({
      success: true,
      data: { message: 'Incident updated successfully.', incident: updated }
    });
  }
}
