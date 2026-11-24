import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AuditService } from '../services/audit.service.js';
import { RequestStatus } from '@prisma/client';

const submitRoleChangeSchema = z.object({
  targetUserId: z.string(),
  roleId: z.string(),
  justification: z.string().min(10, 'A detailed business justification of at least 10 characters is required'),
  durationDays: z.number().int().positive().optional()
});

const reviewRoleChangeSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  decisionReason: z.string().min(5, 'A decision comment is required')
});

export class RoleController {
  /**
   * List all roles with granular permissions
   */
  static async listRoles(req: AuthenticatedRequest, res: Response): Promise<void> {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: true }
        },
        _count: {
          select: { userRoles: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formattedRoles = roles.map((r) => ({
      id: r.id,
      name: r.name,
      displayName: r.displayName,
      description: r.description,
      isPrivileged: r.isPrivileged,
      userCount: r._count.userRoles,
      permissions: r.rolePermissions.map((rp) => rp.permission)
    }));

    res.status(200).json({ success: true, data: { roles: formattedRoles } });
  }

  /**
   * List all granular permissions grouped by module
   */
  static async listPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }]
    });

    res.status(200).json({ success: true, data: { permissions } });
  }

  /**
   * List Role Change Requests with status filter
   */
  static async listRoleRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    const status = req.query.status as RequestStatus | undefined;

    const where: any = {};
    if (status) where.status = status;

    // If regular Employee, only show requests they submitted or are the target of
    if (req.user?.roles.includes('EMPLOYEE') && !req.user?.roles.includes('ADMIN') && !req.user?.roles.includes('SECURITY_OFFICER')) {
      where.OR = [{ requesterId: req.user.id }, { targetUserId: req.user.id }];
    }

    const requests = await prisma.roleChangeRequest.findMany({
      where,
      include: {
        requester: { select: { id: true, email: true, fullName: true } },
        targetUser: { select: { id: true, email: true, fullName: true } },
        role: { select: { id: true, name: true, displayName: true, isPrivileged: true } },
        approver: { select: { id: true, email: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: { requests } });
  }

  /**
   * Submit Role Change Request
   */
  static async createRoleRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }

    const data = submitRoleChangeSchema.parse(req.body);

    const [targetUser, requestedRole] = await Promise.all([
      prisma.user.findUnique({ where: { id: data.targetUserId } }),
      prisma.role.findUnique({ where: { id: data.roleId } })
    ]);

    if (!targetUser) {
      res.status(404).json({ success: false, error: { message: 'Target user does not exist' } });
      return;
    }

    if (!requestedRole) {
      res.status(404).json({ success: false, error: { message: 'Requested role does not exist' } });
      return;
    }

    const request = await prisma.roleChangeRequest.create({
      data: {
        requesterId: req.user.id,
        targetUserId: data.targetUserId,
        roleId: data.roleId,
        justification: data.justification,
        durationDays: data.durationDays || null,
        status: RequestStatus.PENDING
      },
      include: {
        role: true,
        targetUser: { select: { email: true } }
      }
    });

    await AuditService.log({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'ROLE_CHANGE_REQUEST_CREATED',
      resource: 'ROLE_REQUEST',
      resourceId: request.id,
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: {
        targetUser: targetUser.email,
        requestedRole: requestedRole.name,
        isPrivileged: requestedRole.isPrivileged,
        durationDays: data.durationDays
      }
    });

    res.status(201).json({
      success: true,
      data: {
        message: 'Role change request submitted for independent approver review.',
        request
      }
    });
  }

  /**
   * Approve or Reject Role Change Request
   * ENFORCES SEPARATION OF DUTIES: Requester CANNOT approve their own request!
   */
  static async reviewRoleRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }

    const { id } = req.params;
    const { status, decisionReason } = reviewRoleChangeSchema.parse(req.body);

    const request = await prisma.roleChangeRequest.findUnique({
      where: { id },
      include: {
        role: true,
        targetUser: true,
        requester: true
      }
    });

    if (!request) {
      res.status(404).json({ success: false, error: { message: 'Role request not found' } });
      return;
    }

    if (request.status !== RequestStatus.PENDING) {
      res.status(400).json({
        success: false,
        error: { message: `Request is already in state ${request.status} and cannot be modified.` }
      });
      return;
    }

    // STRICT SEPARATION OF DUTIES CHECK
    // No user can approve their own request, nor can target user approve their own elevation!
    if (req.user.id === request.requesterId || req.user.id === request.targetUserId) {
      await AuditService.log({
        actorId: req.user.id,
        actorEmail: req.user.email,
        action: 'SEPARATION_OF_DUTIES_VIOLATION',
        resource: 'ROLE_REQUEST',
        resourceId: request.id,
        status: 'DENIED',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: {
          violationType: 'Self-approval attempt prohibited by security policy',
          requestId: request.id
        }
      });

      res.status(403).json({
        success: false,
        error: {
          message: 'Separation of Duties Violation: You cannot approve or review your own role request.',
          code: 'SEPARATION_OF_DUTIES_VIOLATION'
        }
      });
      return;
    }

    const decisionTime = new Date();

    if (status === 'APPROVED') {
      // Calculate expiry if temporary
      const expiresAt = request.durationDays
        ? new Date(Date.now() + request.durationDays * 24 * 60 * 60 * 1000)
        : null;

      // Update request status and assign role to target user in a single atomic transaction
      await prisma.$transaction([
        prisma.roleChangeRequest.update({
          where: { id },
          data: {
            status: RequestStatus.APPROVED,
            approverId: req.user.id,
            decisionReason,
            decisionAt: decisionTime
          }
        }),
        prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: request.targetUserId,
              roleId: request.roleId
            }
          },
          update: {
            assignedBy: req.user.id,
            assignedAt: decisionTime,
            expiresAt,
            revokedAt: null,
            isTemporary: !!request.durationDays
          },
          create: {
            userId: request.targetUserId,
            roleId: request.roleId,
            assignedBy: req.user.id,
            assignedAt: decisionTime,
            expiresAt,
            isTemporary: !!request.durationDays
          }
        })
      ]);

      await AuditService.log({
        actorId: req.user.id,
        actorEmail: req.user.email,
        action: 'ROLE_CHANGE_APPROVED',
        resource: 'ROLE_REQUEST',
        resourceId: id,
        status: 'SUCCESS',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: {
          targetUser: request.targetUser.email,
          role: request.role.name,
          decisionReason,
          isTemporary: !!request.durationDays,
          expiresAt
        }
      });

      res.status(200).json({
        success: true,
        data: { message: `Role change approved and applied to ${request.targetUser.fullName}.` }
      });
      return;
    } else {
      // REJECTED
      await prisma.roleChangeRequest.update({
        where: { id },
        data: {
          status: RequestStatus.REJECTED,
          approverId: req.user.id,
          decisionReason,
          decisionAt: decisionTime
        }
      });

      await AuditService.log({
        actorId: req.user.id,
        actorEmail: req.user.email,
        action: 'ROLE_CHANGE_REJECTED',
        resource: 'ROLE_REQUEST',
        resourceId: id,
        status: 'SUCCESS',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: {
          targetUser: request.targetUser.email,
          role: request.role.name,
          decisionReason
        }
      });

      res.status(200).json({
        success: true,
        data: { message: 'Role change request rejected.' }
      });
    }
  }
}
