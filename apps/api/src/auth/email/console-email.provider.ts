import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EmailProvider, PasswordResetEmail } from './email-provider';

@Injectable()
export class ConsoleEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  constructor(private readonly config: ConfigService) {}

  sendPasswordReset(message: PasswordResetEmail): Promise<void> {
    if (this.config.getOrThrow<string>('NODE_ENV') === 'production') {
      return Promise.reject(
        new Error('A production email provider is not configured.'),
      );
    }

    this.logger.log(
      JSON.stringify({
        event: 'password_reset_email',
        recipient: message.recipient,
        status: 'accepted',
      }),
    );
    return Promise.resolve();
  }
}
