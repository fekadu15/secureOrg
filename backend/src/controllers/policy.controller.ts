import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AuditService } from '../services/audit.service.js';

const createPolicySchema = z.object({
  title: z.string().min(3),
  code: z.string().min(3),
  category: z.string().min(2),
  version: z.string().default('1.0'),
  content: z.string().min(20)
});

export class PolicyController {
  /**
   * List Security Policies with acknowledgement status for the current user
   */
  static async listPolicies(req: AuthenticatedRequest, res: Response): Promise<void> {
    const policies = await prisma.policy.findMany({
      include: {
        acknowledgements: {
          where: { userId: req.user?.id },
          select: { acknowledgedAt: true, ipAddress: true }
        },
        _count: {
          select: { acknowledgements: true }
        }
      },
      orderBy: { code: 'asc' }
    });

    const formatted = policies.map((p) => ({
      id: p.id,
      title: p.title,
      code: p.code,
      version: p.version,
      category: p.category,
      content: p.content,
      status: p.status,
      publishedAt: p.publishedAt,
      isAcknowledgedByMe: p.acknowledgements.length > 0,
      acknowledgedAt: p.acknowledgements[0]?.acknowledgedAt || null,
      totalAcknowledgements: p._count.acknowledgements
    }));

    res.status(200).json({ success: true, data: { policies: formatted } });
  }

  /**
   * Acknowledge Security Policy (FR-GOV-05)
   */
  static async acknowledgePolicy(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }

    const { id } = req.params;
    const policy = await prisma.policy.findUnique({ where: { id } });

    if (!policy) {
      res.status(404).json({ success: false, error: { message: 'Policy not found' } });
      return;
    }

    const ack = await prisma.policyAcknowledgement.upsert({
      where: {
        policyId_userId: {
          policyId: id,
          userId: req.user.id
        }
      },
      update: {
        acknowledgedAt: new Date(),
        ipAddress: req.ip
      },
      create: {
        policyId: id,
        userId: req.user.id,
        ipAddress: req.ip
      }
    });

    await AuditService.log({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'POLICY_ACKNOWLEDGED',
      resource: 'POLICY',
      resourceId: id,
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { policyCode: policy.code, policyTitle: policy.title, version: policy.version }
    });

    res.status(200).json({
      success: true,
      data: { message: `Policy "${policy.title}" digitally acknowledged.`, acknowledgement: ack }
    });
  }

  /**
   * Create New Security Policy
   */
  static async createPolicy(req: AuthenticatedRequest, res: Response): Promise<void> {
    const data = createPolicySchema.parse(req.body);

    const policy = await prisma.policy.create({
      data: {
        ...data,
        status: 'PUBLISHED'
      }
    });

    await AuditService.log({
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      action: 'POLICY_PUBLISHED',
      resource: 'POLICY',
      resourceId: policy.id,
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { code: policy.code, title: policy.title }
    });

    res.status(201).json({ success: true, data: { policy } });
  }
}
