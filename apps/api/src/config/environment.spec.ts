import { isAllowedCorsOrigin, validateEnvironment } from './environment';

const validProduction = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:password@database:5432/app',
  JWT_SECRET: 'a-strong-production-secret-with-more-than-32-characters',
  CORS_ALLOWED_ORIGINS: 'https://app.example.com',
  APP_URL: 'https://app.example.com',
};

describe('environment validation', () => {
  it('rejects missing required variables', () => {
    expect(() => validateEnvironment({ JWT_SECRET: 'secret' })).toThrow(
      'DATABASE_URL',
    );
  });

  it('rejects weak production JWT secrets', () => {
    expect(() =>
      validateEnvironment({
        ...validProduction,
        JWT_SECRET: 'development-only-secret-change-me',
      }),
    ).toThrow('JWT_SECRET');
  });

  it('accepts and rejects CORS origins explicitly', () => {
    const environment = validateEnvironment(validProduction);
    expect(
      isAllowedCorsOrigin(
        'https://app.example.com',
        environment.CORS_ALLOWED_ORIGINS,
      ),
    ).toBe(true);
    expect(
      isAllowedCorsOrigin(
        'https://evil.example.com',
        environment.CORS_ALLOWED_ORIGINS,
      ),
    ).toBe(false);
  });

  it('rejects invalid application URLs', () => {
    expect(() =>
      validateEnvironment({ ...validProduction, APP_URL: 'not-a-url' }),
    ).toThrow('APP_URL');
  });
});
