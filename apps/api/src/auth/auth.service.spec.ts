import { HttpStatus } from '@nestjs/common';
import { hash } from 'argon2';
import { AuthService } from './auth.service';
import { MockEmailProvider } from './email/mock-email.provider';

function createService() {
  const prisma = {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(
        (input: { data: { tokenVersion: { increment: number } } }) => input,
      ),
    },
    passwordResetToken: {
      deleteMany: jest.fn(() => ({ operation: 'deleteMany' })),
      create: jest.fn((input: unknown) => ({ operation: 'create', input })),
      findUnique: jest.fn(),
      update: jest.fn(() => ({ operation: 'update' })),
      updateMany: jest.fn(() => ({ operation: 'updateMany' })),
    },
    $transaction: jest.fn().mockResolvedValue([]),
  };
  const config = {
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, unknown> = {
        APP_URL: 'http://localhost:3000',
        NODE_ENV: 'test',
        PASSWORD_RESET_EXPIRES_MINUTES: 30,
      };
      return values[key];
    }),
  };
  const email = new MockEmailProvider();
  const service = new AuthService(
    prisma as never,
    {} as never,
    config as never,
    email,
  );
  return { service, prisma, email };
}

describe('AuthService password recovery', () => {
  it('returns the same neutral response for an unknown email', async () => {
    const { service, prisma, email } = createService();
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(
      service.requestPasswordReset('none@example.com'),
    ).resolves.toEqual({ accepted: true });
    expect(email.passwordResetMessages).toHaveLength(0);
  });

  it('stores a token hash and sends the raw token only to the provider', async () => {
    const { service, prisma, email } = createService();
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      preferredLocale: 'EN',
    });
    await service.requestPasswordReset('user@example.com');
    expect(email.passwordResetMessages).toHaveLength(1);
    const resetUrl = new URL(email.passwordResetMessages[0].resetUrl);
    const rawToken = resetUrl.searchParams.get('token');
    expect(rawToken).toHaveLength(64);
    const createInput = prisma.passwordResetToken.create.mock.calls[0][0] as {
      data: { tokenHash: string };
    };
    expect(createInput.data.tokenHash).not.toBe(rawToken);
    expect(JSON.stringify(prisma.$transaction.mock.calls[0])).not.toContain(
      rawToken,
    );
  });

  it('rejects expired and reused tokens', async () => {
    const { service, prisma } = createService();
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      user: { deletedAt: null },
    });
    await expect(
      service.resetPassword({
        token: 'x'.repeat(64),
        password: 'new-password',
      }),
    ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
  });

  it('updates the password and invalidates existing sessions', async () => {
    const { service, prisma } = createService();
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'token-id',
      userId: 'user-id',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { deletedAt: null, passwordHash: await hash('old-password') },
    });
    await expect(
      service.resetPassword({
        token: 'x'.repeat(64),
        password: 'new-password',
      }),
    ).resolves.toEqual({ reset: true });
    const updateInput = prisma.user.update.mock.calls[0][0];
    expect(updateInput.data.tokenVersion).toEqual({ increment: 1 });
  });
});
