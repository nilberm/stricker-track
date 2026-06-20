import { ArgumentsHost, Logger } from '@nestjs/common';
import { ApiExceptionFilter } from './api-exception.filter';

describe('ApiExceptionFilter', () => {
  it('returns a request ID without exposing internal error details', () => {
    const log = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const request = {
      requestId: 'request-123',
      method: 'GET',
      originalUrl: '/api/v1/private?token=secret',
    };
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;

    new ApiExceptionFilter().catch(
      new Error('internal database failure'),
      host,
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        requestId: 'request-123',
      }),
    );
    expect(JSON.stringify(json.mock.calls)).not.toContain(
      'internal database failure',
    );
    log.mockRestore();
  });
});
