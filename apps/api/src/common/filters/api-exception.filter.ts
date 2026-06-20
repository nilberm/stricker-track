import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { Logger } from '@nestjs/common';
import type { RequestWithContext } from '../request-context.middleware';

type ErrorResponse = {
  code?: string;
  message?: string | string[];
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest<RequestWithContext>();
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw =
      exception instanceof HttpException ? exception.getResponse() : null;
    const details =
      typeof raw === 'object' && raw !== null ? (raw as ErrorResponse) : {};

    const code =
      details.code ??
      (status === 400 ? 'VALIDATION_FAILED' : 'INTERNAL_SERVER_ERROR');
    if (status >= 500) {
      this.logger.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          service: 'sticker-track-api',
          requestId: request.requestId,
          method: request.method,
          path: request.originalUrl.split('?')[0],
          statusCode: status,
          errorCode: code,
        }),
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      code,
      message:
        status >= 500
          ? 'An unexpected error occurred'
          : (details.message ??
            (typeof raw === 'string' ? raw : 'The request failed')),
      statusCode: status,
      timestamp: new Date().toISOString(),
      requestId: request.requestId,
    });
  }
}
