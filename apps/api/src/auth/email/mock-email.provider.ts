import type { EmailProvider, PasswordResetEmail } from './email-provider';

export class MockEmailProvider implements EmailProvider {
  readonly passwordResetMessages: PasswordResetEmail[] = [];

  sendPasswordReset(message: PasswordResetEmail): Promise<void> {
    this.passwordResetMessages.push(message);
    return Promise.resolve();
  }
}
