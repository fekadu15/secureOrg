import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';
import { AuditService } from '../services/audit.service.js';

/**
 * Requires a specific granular permission code
 */
export const requirePermission = (permissionCode: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required', code: 'UNAUTHENTICATED' }
      });
      return;
    }

    if (req.user.mfaPending) {
      res.status(403).json({
        success: false,
        error: { message: 'MFA verification required to perform this action', code: 'MFA_REQUIRED' }
      });
      return;
    }

    const hasPerm = req.user.permissions.includes(permissionCode);
    if (!hasPerm) {
      // Log authorization denial to audit trail
      await AuditService.log({
        actorId: req.user.id,
        actorEmail: req.user.email,
        action: 'AUTHORIZATION_DENIED',
        resource: req.originalUrl,
        status: 'DENIED',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: {
          requiredPermission: permissionCode,
          userPermissions: req.user.permissions
        }
      });

      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. You do not possess the required privilege for this action.',
          code: 'FORBIDDEN',
          requiredPermission: permissionCode
        }
      });
      return;
    }

    next();
  };
};

/**
 * Requires any of the provided roles
 */
export const requireRole = (...allowedRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required', code: 'UNAUTHENTICATED' }
      });
      return;
    }

    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      await AuditService.log({
        actorId: req.user.id,
        actorEmail: req.user.email,
        action: 'ROLE_AUTHORIZATION_DENIED',
        resource: req.originalUrl,
        status: 'DENIED',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { allowedRoles, userRoles: req.user.roles }
      });

      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. Your role is not authorized for this resource.',
          code: 'ROLE_FORBIDDEN'
        }
      });
      return;
    }

    next();
  };
};
