import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@sticker-track/database';

export const rolesMetadataKey = 'roles';
export const Roles = (...roles: UserRole[]) =>
  SetMetadata(rolesMetadataKey, roles);
