import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '@sticker-track/shared';

export class ApiError extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    status: HttpStatus,
  ) {
    super({ code, message }, status);
  }
}
