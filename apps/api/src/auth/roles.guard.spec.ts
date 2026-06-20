import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@sticker-track/database';
import { RolesGuard } from './roles.guard';

function context(role: UserRole) {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user: { role } }),
    }),
  };
}

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN]),
  };
  const guard = new RolesGuard(reflector as never);

  it('allows administrators', () => {
    expect(guard.canActivate(context(UserRole.ADMIN) as never)).toBe(true);
  });

  it('returns 403 for regular users', () => {
    expect(() => guard.canActivate(context(UserRole.USER) as never)).toThrow(
      ForbiddenException,
    );
  });
});
