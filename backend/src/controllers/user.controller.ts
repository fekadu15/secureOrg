import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AuditService } from '../services/audit.service.js';
import { CryptoService } from '../services/crypto.service.js';
import { AccountStatus } from '@prisma/client';

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  unitId: z.string().optional(),
  roleId: z.string(),
  initialPassword: z.string().min(12)
});

const updateUserStatusSchema = z.object({
  status: z.nativeEnum(AccountStatus),
  reason: z.string().min(3, 'A valid reason is required for account state change')
});

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(12)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/)
    .optional()
});

export class UserController {
  /**
   * List users with pagination and search
   */
  static async listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '10', 10)));
    const search = (req.query.search as string) || '';
    const status = req.query.status as AccountStatus | undefined;
    const unitId = req.query.unitId as string | undefined;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status) where.status = status;
    if (unitId) where.unitId = unitId;

    // Scoping for Department Managers: only users within their assigned unit
    if (req.user?.roles.includes('DEPARTMENT_MANAGER') && !req.user?.roles.includes('ADMIN') && !req.user?.roles.includes('SECURITY_OFFICER')) {
      if (req.user.unitId) {
        where.unitId = req.user.unitId;
      }
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          status: true,
          mfaEnabled: true,
          lastLoginAt: true,
          createdAt: true,
          unit: {
            select: { id: true, name: true, code: true }
          },
          userRoles: {
            select: {
              role: {
                select: { id: true, name: true, displayName: true, isPrivileged: true }
              }
            }
          }
        }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
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
   * Get single user details by ID
   */
  static async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        status: true,
        mfaEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        unit: {
          select: { id: true, name: true, code: true }
        },
        userRoles: {
          select: {
            assignedAt: true,
            expiresAt: true,
            role: {
              select: { id: true, name: true, displayName: true, isPrivileged: true }
            }
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found' } });
      return;
    }

    res.status(200).json({ success: true, data: { user } });
  }

  /**
   * Create / Invite new user account
   */
  static async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const data = createUserSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      res.status(409).json({ success: false, error: { message: 'Email address already in use.' } });
      return;
    }

    const passwordHash = await CryptoService.hashPassword(data.initialPassword);

    const newUser = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        fullName: data.fullName,
        phone: data.phone,
        passwordHash,
        unitId: data.unitId || null,
        status: AccountStatus.ACTIVE,
        userRoles: {
          create: {
            roleId: data.roleId,
            assignedBy: req.user?.id || 'ADMIN'
          }
        }
      },
      include: {
        userRoles: { include: { role: true } }
      }
    });

    await AuditService.log({
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      action: 'USER_CREATED',
      resource: 'USER',
      resourceId: newUser.id,
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { targetEmail: newUser.email, assignedRole: newUser.userRoles[0]?.role.name }
    });

    res.status(201).json({
      success: true,
      data: {
        message: 'User account created successfully.',
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          status: newUser.status
        }
      }
    });
  }

  /**
   * Update Account Status (Suspend, Lock, Reactivate, Deactivate)
   */
  static async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { status, reason } = updateUserStatusSchema.parse(req.body);

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ success: false, error: { message: 'Target user not found' } });
      return;
    }

    const previousStatus = targetUser.status;

    await prisma.user.update({
      where: { id },
      data: {
        status,
        failedLoginAttempts: status === AccountStatus.ACTIVE ? 0 : targetUser.failedLoginAttempts,
        lockoutUntil: status === AccountStatus.ACTIVE ? null : targetUser.lockoutUntil
      }
    });

    // If suspended or deactivated, revoke all active sessions
    if (status === AccountStatus.SUSPENDED || status === AccountStatus.DEACTIVATED) {
      await prisma.session.updateMany({
        where: { userId: id },
        data: { isValid: false }
      });
    }

    await AuditService.log({
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      action: `USER_STATUS_CHANGE_${status}`,
      resource: 'USER',
      resourceId: id,
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { previousStatus, newStatus: status, reason }
    });

    res.status(200).json({
      success: true,
      data: { message: `Account status updated to ${status}.` }
    });
  }

  /**
   * Update Current User Profile
   */
  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }

    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found' } });
      return;
    }

    const updatePayload: any = {};
    if (data.fullName) updatePayload.fullName = data.fullName;
    if (data.phone !== undefined) updatePayload.phone = data.phone;

    // Handle password change if requested
    if (data.newPassword) {
      if (!data.currentPassword) {
        res.status(400).json({
          success: false,
          error: { message: 'Current password is required to set a new password.' }
        });
        return;
      }

      const match = await CryptoService.verifyPassword(data.currentPassword, user.passwordHash);
      if (!match) {
        await AuditService.log({
          actorId: user.id,
          actorEmail: user.email,
          action: 'PASSWORD_CHANGE_FAILED',
          resource: 'USER',
          resourceId: user.id,
          status: 'FAILURE',
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        });

        res.status(400).json({
          success: false,
          error: { message: 'Current password provided is incorrect.' }
        });
        return;
      }

      updatePayload.passwordHash = await CryptoService.hashPassword(data.newPassword);
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: updatePayload
    });

    await AuditService.log({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'PROFILE_UPDATED',
      resource: 'USER',
      resourceId: req.user.id,
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { fieldsUpdated: Object.keys(updatePayload) }
    });

    res.status(200).json({
      success: true,
      data: { message: 'Profile updated successfully.' }
    });
  }
}
