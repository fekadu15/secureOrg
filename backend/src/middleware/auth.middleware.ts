
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../utils/prisma.js';
import { AccountStatus } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  unitId?: string | null;
  mfaPending?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

interface AccessTokenPayload extends JwtPayload {
  userId: string;
  email: string;
  mfaPending?: boolean;
}

export const authenticateJwt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else {
      const authorization = req.headers.authorization;

      if (authorization?.startsWith('Bearer ')) {
        token = authorization.slice(7).trim();
      }
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required. No token provided.',
          code: 'UNAUTHENTICATED'
        }
      });
      return;
    }

    let decoded: AccessTokenPayload;

    try {
      const verified = jwt.verify(
        token,
        config.jwt.secret,
        { algorithms: ['HS256'] }
      );

      if (
        typeof verified === 'string' ||
        typeof verified.userId !== 'string' ||
        typeof verified.email !== 'string'
      ) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Invalid authentication token payload.',
            code: 'INVALID_TOKEN'
          }
        });
        return;
      }

      decoded = verified as AccessTokenPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Session expired. Please log in again.',
            code: 'TOKEN_EXPIRED'
          }
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or malformed authentication token.',
          code: 'INVALID_TOKEN'
        }
      });
      return;
    }

    if (decoded.mfaPending === true) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Multi-factor authentication must be completed before accessing protected resources.',
          code: 'MFA_REQUIRED'
        }
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'User account not found or has been revoked.',
          code: 'USER_NOT_FOUND'
        }
      });
      return;
    }

    if (user.status !== AccountStatus.ACTIVE) {
      res.status(403).json({
        success: false,
        error: {
          message: `Access denied. Account status is ${user.status}.`,
          code: `ACCOUNT_${user.status}`
        }
      });
      return;
    }

    const now = new Date();
    const roles: string[] = [];
    const permissionsSet = new Set<string>();

    for (const userRole of user.userRoles) {
      if (
        userRole.revokedAt ||
        (userRole.expiresAt && userRole.expiresAt <= now)
      ) {
        continue;
      }

      roles.push(userRole.role.name);

      for (const rolePermission of userRole.role.rolePermissions) {
        permissionsSet.add(rolePermission.permission.code);
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: [...new Set(roles)],
      permissions: Array.from(permissionsSet),
      unitId: user.unitId,
      mfaPending: false
    };

    next();
  } catch (error) {
    next(error);
  }
};
