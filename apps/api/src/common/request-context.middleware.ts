import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const requestIdHeader = 'x-request-id';
export type RequestWithContext = Request & {
  requestId: string;
  user?: { userId?: string };
};

export function requestContextMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const received = request.header(requestIdHeader);
  const requestId =
    received && /^[a-zA-Z0-9._-]{8,128}$/.test(received)
      ? received
      : randomUUID();
  (request as RequestWithContext).requestId = requestId;
  response.setHeader(requestIdHeader, requestId);
  next();
}
