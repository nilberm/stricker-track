import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, type User } from '@sticker-track/database';
import {
  databaseToLocale,
  defaultLocale,
  errorCodes,
  localeToDatabase,
} from '@sticker-track/shared';
import { createHash, randomBytes } from 'node:crypto';
import { hash, verify } from 'argon2';
import { ApiError } from '../common/api-error';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EMAIL_PROVIDER, type EmailProvider } from './email/email-provider';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: EmailProvider,
  ) {}

  async register(input: RegisterDto) {
    const email = input.email.trim().toLowerCase();

    try {
      const user = await this.prisma.user.create({
        data: {
          name: input.name.trim(),
          email,
          passwordHash: await hash(input.password),
          preferredLocale:
            localeToDatabase[input.preferredLocale ?? defaultLocale],
        },
      });

      return this.createSession(user);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ApiError(
          errorCodes.emailAlreadyExists,
          'An account with this email already exists',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.trim().toLowerCase() },
    });

    if (
      !user ||
      user.deletedAt ||
      !(await verify(user.passwordHash, input.password))
    ) {
      throw new ApiError(
        errorCodes.invalidCredentials,
        'Email or password is invalid',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.createSession(user);
  }

  async requestPasswordReset(emailInput: string) {
    const email = emailInput.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (user) {
      const token = randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(token);
      const expiresAt = new Date(
        Date.now() +
          this.config.getOrThrow<number>('PASSWORD_RESET_EXPIRES_MINUTES') *
            60_000,
      );

      await this.prisma.$transaction([
        this.prisma.passwordResetToken.deleteMany({
          where: { userId: user.id, usedAt: null },
        }),
        this.prisma.passwordResetToken.create({
          data: { userId: user.id, tokenHash, expiresAt },
        }),
      ]);

      const resetUrl = new URL(
        `/${databaseToLocale[user.preferredLocale]}/reset-password`,
        this.config.getOrThrow<string>('APP_URL'),
      );
      resetUrl.searchParams.set('token', token);
      await this.emailProvider.sendPasswordReset({
        recipient: user.email,
        resetUrl: resetUrl.toString(),
      });
    }

    return { accepted: true };
  }

  async resetPassword(input: ResetPasswordDto) {
    const now = new Date();
    const tokenHash = this.hashToken(input.token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt <= now ||
      resetToken.user.deletedAt
    ) {
      throw new ApiError(
        errorCodes.invalidOrExpiredResetToken,
        'The password reset token is invalid or expired',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: now },
      }),
      this.prisma.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          id: { not: resetToken.id },
          usedAt: null,
        },
        data: { usedAt: now },
      }),
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash: await hash(input.password),
          tokenVersion: { increment: 1 },
        },
      }),
    ]);

    return { reset: true };
  }

  private async createSession(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: this.config.getOrThrow<number>('JWT_EXPIRES_IN_SECONDS'),
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLocale: databaseToLocale[user.preferredLocale],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
