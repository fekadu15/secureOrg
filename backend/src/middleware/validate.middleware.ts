
import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

interface ValidationSchema {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}

/**
 * Express middleware that validates request body, query, and params using Zod schemas.
 * Returns a standardized 400 response with detailed field-level error messages upon validation failure.
 */
export const validate = (schema: ValidationSchema) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }

      if (schema.query) {
        req.query = (await schema.query.parseAsync(req.query)) as any;
      }

      if (schema.params) {
        req.params = (await schema.params.parseAsync(req.params)) as any;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((e) => ({
          field: e.path.join('.') || 'root',
          message: e.message,
          rule: e.code
        }));

        res.status(400).json({
          success: false,
          error: {
            message: 'Input validation failed. Please check your request parameters.',
            code: 'VALIDATION_ERROR',
            details: formattedErrors
          }
        });
        return;
      }

      next(error);
    }
  };
};
