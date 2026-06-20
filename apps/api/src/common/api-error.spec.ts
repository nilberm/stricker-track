import { HttpStatus } from '@nestjs/common';
import { errorCodes } from '@sticker-track/shared';
import { ApiError } from './api-error';

describe('ApiError', () => {
  it('keeps a stable error code for frontend translation', () => {
    const error = new ApiError(
      errorCodes.invalidCredentials,
      'Email or password is invalid',
      HttpStatus.UNAUTHORIZED,
    );

    expect(error.code).toBe('INVALID_CREDENTIALS');
    expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(error.getResponse()).toEqual({
      code: 'INVALID_CREDENTIALS',
      message: 'Email or password is invalid',
    });
  });
});
