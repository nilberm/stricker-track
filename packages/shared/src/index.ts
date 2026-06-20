export const locales = ['pt-BR', 'en', 'es'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'pt-BR';

export const localeToDatabase = {
  'pt-BR': 'PT_BR',
  en: 'EN',
  es: 'ES',
} as const;

export const databaseToLocale = {
  PT_BR: 'pt-BR',
  EN: 'en',
  ES: 'es',
} as const;

export const errorCodes = {
  accountDeletionConfirmationInvalid: 'ACCOUNT_DELETION_CONFIRMATION_INVALID',
  accountDeletionForbidden: 'ACCOUNT_DELETION_FORBIDDEN',
  emailAlreadyExists: 'EMAIL_ALREADY_EXISTS',
  invalidCredentials: 'INVALID_CREDENTIALS',
  invalidOrExpiredResetToken: 'INVALID_OR_EXPIRED_RESET_TOKEN',
  unauthorized: 'UNAUTHORIZED',
  validationFailed: 'VALIDATION_FAILED',
} as const;

export type ErrorCode = (typeof errorCodes)[keyof typeof errorCodes];

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}

export * from './sticker-code';
