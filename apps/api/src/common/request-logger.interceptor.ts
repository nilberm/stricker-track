import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable, tap } from 'rxjs';
import type { RequestWithContext } from './request-context.middleware';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(request, response, startedAt),
        error: () => this.log(request, response, startedAt),
      }),
    );
  }

  private log(
    request: RequestWithContext,
    response: Response,
    startedAt: number,
  ) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'sticker-track-api',
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl.split('?')[0],
      statusCode: response.statusCode,
      duration: Date.now() - startedAt,
      userId: request.user?.userId,
    };
    this.logger.log(JSON.stringify(entry));
  }
}
