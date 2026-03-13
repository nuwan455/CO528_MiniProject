import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let errors: unknown[] = [];

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        message = payload;
      } else if (typeof payload === 'object' && payload) {
        const errorPayload = payload as Record<string, unknown>;
        message = String(errorPayload.message ?? message);
        if (Array.isArray(errorPayload.message)) {
          errors = errorPayload.message;
          message = 'Validation failed';
        } else if (Array.isArray(errorPayload.errors)) {
          errors = errorPayload.errors;
        }
      }
    }

    response.status(status).json({
      success: false,
      message,
      errors,
    });
  }
}
