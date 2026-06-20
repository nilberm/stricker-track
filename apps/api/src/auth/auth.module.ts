import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { ConsoleEmailProvider } from './email/console-email.provider';
import { EMAIL_PROVIDER } from './email/email-provider';

@Module({
  imports: [PassportModule, JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    ConsoleEmailProvider,
    { provide: EMAIL_PROVIDER, useExisting: ConsoleEmailProvider },
  ],
})
export class AuthModule {}
