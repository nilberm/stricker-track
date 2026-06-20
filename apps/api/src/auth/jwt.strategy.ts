import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { errorCodes } from '@sticker-track/shared';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ApiError } from '../common/api-error';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from './auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        deletedAt: true,
        tokenVersion: true,
      },
    });
    if (!user || user.deletedAt || user.tokenVersion !== payload.tokenVersion) {
      throw new ApiError(
        errorCodes.unauthorized,
        'The session is no longer valid',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
