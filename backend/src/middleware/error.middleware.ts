
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../config/index.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('[Internal Error]:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));

    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid input data. Please check field requirements.',
        code: 'VALIDATION_ERROR',
        details: formattedErrors
      }
    });
    return;
  }

  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Database operation failed due to a constraint or data error.',
        code: 'DATABASE_ERROR'
      }
    });
    return;
  }

  const statusCode =
    err.statusCode ||
    (err.status && typeof err.status === 'number' ? err.status : 500);

  const response: any = {
    success: false,
    error: {
      message:
        statusCode === 500 && config.nodeEnv === 'production'
          ? 'An unexpected internal security error occurred. Please contact an administrator.'
          : err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR'
    }
  };

  if (config.nodeEnv === 'development' && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
