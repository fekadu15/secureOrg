import { Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AuditService } from '../services/audit.service.js';

export class AuditController {
  /**
   * List Audit Events with filtering and pagination
   */
  static async listEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const action = req.query.action as string | undefined;
    const actorEmail = req.query.actorEmail as string | undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (actorEmail) where.actorEmail = { contains: actorEmail, mode: 'insensitive' };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { actorEmail: { contains: search, mode: 'insensitive' } },
        { resource: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [total, events] = await Promise.all([
      prisma.auditEvent.count({ where }),
      prisma.auditEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          actor: {
            select: { id: true, email: true, fullName: true }
          }
        }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  }

  /**
   * Run Cryptographic Hash Chain Integrity Verification
   * Verifies that no record has been tampered with or deleted from the database.
   */
  static async verifyIntegrity(req: AuthenticatedRequest, res: Response): Promise<void> {
    const verificationResult = await AuditService.verifyChain();

    // Log the verification attempt itself (NFR-OBS-02: audit access must be audited)
    await AuditService.log({
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      action: 'AUDIT_INTEGRITY_VERIFICATION_EXECUTED',
      resource: 'AUDIT_LOGS',
      status: verificationResult.isValid ? 'SUCCESS' : 'FAILURE',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: {
        totalRecords: verificationResult.totalRecords,
        verifiedRecords: verificationResult.verifiedRecords,
        isValid: verificationResult.isValid
      }
    });

    res.status(200).json({
      success: true,
      data: {
        ...verificationResult,
        verifiedAt: new Date().toISOString(),
        verifiedBy: req.user?.email
      }
    });
  }
}
