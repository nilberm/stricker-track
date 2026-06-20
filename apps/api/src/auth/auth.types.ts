import type { UserRole } from '@sticker-track/database';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
};

export type AuthenticatedUser = {
  userId: string;
  email: string;
  role: UserRole;
};
