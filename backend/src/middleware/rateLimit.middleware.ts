
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service.js';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const logRateLimitEvent = async (
  req: Request,
  action: string
): Promise<void> => {
  await AuditService.log({
    action,
    resource: req.originalUrl,
    status: 'DENIED',
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    metadata: {
      endpoint: req.originalUrl,
      method: req.method
    }
  });
};

export const authRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req: Request, res: Response) => {
    await logRateLimitEvent(req, 'AUTH_RATE_LIMIT_EXCEEDED');

    res.status(429).json({
      success: false,
      error: {
        message: 'Too many authentication requests. Please try again after 15 minutes.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED'
      }
    });
  }
});

export const mfaRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req: Request, res: Response) => {
    await logRateLimitEvent(req, 'MFA_RATE_LIMIT_EXCEEDED');

    res.status(429).json({
      success: false,
      error: {
        message: 'Too many MFA verification attempts. Please try again after 15 minutes.',
        code: 'MFA_RATE_LIMIT_EXCEEDED'
      }
    });
  }
});

export const apiRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many API requests. Please slow down.',
      code: 'API_RATE_LIMIT_EXCEEDED'
    }
  }
});
