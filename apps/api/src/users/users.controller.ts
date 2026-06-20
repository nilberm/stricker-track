import { Body, Controller, Delete, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UsersService } from './users.service';
import { DeleteAccountDto } from './dto/delete-account.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch('me/preferences')
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdatePreferencesDto,
  ) {
    return this.users.updatePreferences(user.userId, input.preferredLocale);
  }

  @Delete('me')
  deleteAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: DeleteAccountDto,
  ) {
    return this.users.deleteAccount(user.userId, input);
  }
}
