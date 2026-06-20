import { HttpStatus } from '@nestjs/common';
import { UserRole } from '@sticker-track/database';
import { hash } from 'argon2';
import { UsersService } from './users.service';

describe('UsersService account deletion', () => {
  it('requires explicit confirmation', async () => {
    const service = new UsersService({} as never);
    await expect(
      service.deleteAccount('user-id', {
        currentPassword: 'correct-password',
        confirmation: 'WRONG' as 'DELETE',
      }),
    ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
  });

  it('requires the current password', async () => {
    const prisma = {
      user: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'user-id',
          passwordHash: await hash('correct-password'),
          role: UserRole.USER,
        }),
      },
    };
    const service = new UsersService(prisma as never);
    await expect(
      service.deleteAccount('user-id', {
        currentPassword: 'wrong-password',
        confirmation: 'DELETE',
      }),
    ).rejects.toMatchObject({ status: HttpStatus.UNAUTHORIZED });
  });

  it('removes personal data and anonymizes the account', async () => {
    const prisma = {
      user: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'user-id',
          passwordHash: await hash('correct-password'),
          role: UserRole.USER,
        }),
        update: jest.fn(
          (input: {
            data: { deletedAt: Date; tokenVersion: { increment: number } };
          }) => input,
        ),
      },
      passwordResetToken: { deleteMany: jest.fn(() => ({})) },
      emailVerificationToken: { deleteMany: jest.fn(() => ({})) },
      stickerScan: { deleteMany: jest.fn(() => ({})) },
      userCollection: { deleteMany: jest.fn(() => ({})) },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const service = new UsersService(prisma as never);
    await service.deleteAccount('user-id', {
      currentPassword: 'correct-password',
      confirmation: 'DELETE',
    });
    expect(prisma.$transaction).toHaveBeenCalled();
    const updateInput = prisma.user.update.mock.calls[0][0];
    expect(updateInput.data.deletedAt).toBeInstanceOf(Date);
    expect(updateInput.data.tokenVersion).toEqual({ increment: 1 });
  });
});
