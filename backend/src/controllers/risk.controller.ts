import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AuditService } from '../services/audit.service.js';

const createRiskSchema = z.object({
  title: z.string().min(3),
  category: z.string().min(2),
  description: z.string().min(10),
  likelihood: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  status: z.string().default('IDENTIFIED'),
  owner: z.string().optional(),
  treatmentStrategy: z.string().optional()
});

const updateRiskSchema = z.object({
  title: z.string().min(3).optional(),
  category: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  likelihood: z.number().int().min(1).max(5).optional(),
  impact: z.number().int().min(1).max(5).optional(),
  status: z.string().optional(),
  owner: z.string().optional(),
  treatmentStrategy: z.string().optional()
});

export class RiskController {
  /**
   * List Organizational Risks
   */
  static async listRisks(req: AuthenticatedRequest, res: Response): Promise<void> {
    const risks = await prisma.risk.findMany({
      orderBy: { riskScore: 'desc' }
    });

    res.status(200).json({ success: true, data: { risks } });
  }

  /**
   * Create Risk Entry
   */
  static async createRisk(req: AuthenticatedRequest, res: Response): Promise<void> {
    const data = createRiskSchema.parse(req.body);
    const riskScore = data.likelihood * data.impact;

    const risk = await prisma.risk.create({
      data: {
        ...data,
        riskScore
      }
    });

    await AuditService.log({
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      action: 'RISK_CREATED',
      resource: 'RISK',
      resourceId: risk.id,
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { title: risk.title, score: riskScore }
    });

    res.status(201).json({ success: true, data: { risk } });
  }

  /**
   * Update Risk Treatment and Status
   */
  static async updateRisk(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const data = updateRiskSchema.parse(req.body);

    const existing = await prisma.risk.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, error: { message: 'Risk item not found' } });
      return;
    }

    const likelihood = data.likelihood ?? existing.likelihood;
    const impact = data.impact ?? existing.impact;
    const riskScore = likelihood * impact;

    const updated = await prisma.risk.update({
      where: { id },
      data: {
        ...data,
        riskScore
      }
    });

    await AuditService.log({
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      action: 'RISK_UPDATED',
      resource: 'RISK',
      resourceId: id,
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { title: updated.title, newScore: riskScore }
    });

    res.status(200).json({ success: true, data: { risk: updated } });
  }
}
