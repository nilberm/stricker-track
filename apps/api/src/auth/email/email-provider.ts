export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');

export type PasswordResetEmail = {
  recipient: string;
  resetUrl: string;
};

export interface EmailProvider {
  sendPasswordReset(message: PasswordResetEmail): Promise<void>;
}
