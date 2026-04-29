import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { ZodError } from 'zod';
import type { Response } from 'express';

/**
 * 🛠️ ZOD EXCEPTION FILTER
 * Captures Zod validation errors and transforms them into a
 * frontend-friendly 'errors' object mapped by field name.
 *
 * Example Response:
 * {
 *   "success": false,
 *   "message": "Validation failed",
 *   "errors": { "email": "Invalid email format", "password": "Too short" }
 * }
 */
@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const errors = exception.issues.reduce(
      (acc, issue) => {
        const path = issue.path.join('.');
        acc[path] = issue.message;
        return acc;
      },
      {} as Record<string, string>,
    );

    response.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }
}
