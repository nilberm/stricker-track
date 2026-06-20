import { HttpStatus, Injectable } from '@nestjs/common';
import { type User, UserRole } from '@sticker-track/database';
import {
  databaseToLocale,
  localeToDatabase,
  type Locale,
  errorCodes,
} from '@sticker-track/shared';
import { hash, verify } from 'argon2';
import { randomBytes, randomUUID } from 'node:crypto';
import { ApiError } from '../common/api-error';
import { PrismaService } from '../prisma/prisma.service';
import { DeleteAccountDto } from './dto/delete-account.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublicById(id: string) {
    return this.toPublicUser(
      await this.prisma.user.findUniqueOrThrow({ where: { id } }),
    );
  }

  async updatePreferences(userId: string, preferredLocale: Locale) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferredLocale: localeToDatabase[preferredLocale],
      },
    });
    return this.toPublicUser(user);
  }

  async deleteAccount(userId: string, input: DeleteAccountDto) {
    if (input.confirmation !== 'DELETE') {
      throw new ApiError(
        errorCodes.accountDeletionConfirmationInvalid,
        'The account deletion confirmation is invalid',
        HttpStatus.BAD_REQUEST,
      );
    }
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (!(await verify(user.passwordHash, input.currentPassword))) {
      throw new ApiError(
        errorCodes.invalidCredentials,
        'The current password is invalid',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.role === UserRole.ADMIN) {
      const activeAdmins = await this.prisma.user.count({
        where: { role: UserRole.ADMIN, deletedAt: null },
      });
      if (activeAdmins <= 1) {
        throw new ApiError(
          errorCodes.accountDeletionForbidden,
          'The last active administrator cannot delete their account',
          HttpStatus.CONFLICT,
        );
      }
    }

    const deletedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { userId } }),
      this.prisma.emailVerificationToken.deleteMany({ where: { userId } }),
      this.prisma.stickerScan.deleteMany({ where: { userId } }),
      this.prisma.userCollection.deleteMany({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          name: 'Deleted user',
          email: `deleted-${randomUUID()}@deleted.invalid`,
          passwordHash: await hash(randomBytes(48).toString('hex')),
          role: UserRole.USER,
          deletedAt,
          tokenVersion: { increment: 1 },
        },
      }),
    ]);

    return { deleted: true, deletedAt };
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferredLocale: databaseToLocale[user.preferredLocale],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
