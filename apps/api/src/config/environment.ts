const insecureJwtSecrets = new Set([
  '',
  'replace-with-a-long-random-secret',
  'development-only-secret-change-me',
]);

export type AppEnvironment = ReturnType<typeof validateEnvironment>;

export function validateEnvironment(environment: Record<string, unknown>) {
  const nodeEnv = stringValue(environment.NODE_ENV, 'development');
  const production = nodeEnv === 'production';
  const jwtSecret = stringValue(environment.JWT_SECRET);
  const databaseUrl = stringValue(environment.DATABASE_URL);
  const corsAllowedOrigins = listValue(
    environment.CORS_ALLOWED_ORIGINS ?? environment.CORS_ORIGIN,
    production ? [] : ['http://localhost:3000'],
  );

  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  if (!jwtSecret) throw new Error('JWT_SECRET is required.');
  if (
    production &&
    (jwtSecret.length < 32 || insecureJwtSecrets.has(jwtSecret))
  ) {
    throw new Error(
      'JWT_SECRET must contain at least 32 characters and must not use a development default in production.',
    );
  }
  if (production && corsAllowedOrigins.length === 0) {
    throw new Error('CORS_ALLOWED_ORIGINS is required in production.');
  }
  for (const origin of corsAllowedOrigins) {
    const url = parseHttpUrl(origin, 'CORS_ALLOWED_ORIGINS');
    if (production && url.protocol !== 'https:') {
      throw new Error('CORS_ALLOWED_ORIGINS must use HTTPS in production.');
    }
  }

  return {
    NODE_ENV: nodeEnv,
    API_PORT: numberValue(environment.API_PORT, 3001, 1, 65535),
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN_SECONDS: numberValue(
      environment.JWT_EXPIRES_IN_SECONDS ?? environment.JWT_EXPIRES_IN,
      86_400,
      60,
      2_592_000,
    ),
    CORS_ALLOWED_ORIGINS: corsAllowedOrigins,
    APP_URL: urlValue(
      environment.APP_URL ?? environment.NEXT_PUBLIC_APP_URL,
      production ? undefined : 'http://localhost:3000',
    ),
    RATE_LIMIT_TTL: numberValue(environment.RATE_LIMIT_TTL, 60_000, 1_000),
    RATE_LIMIT_MAX: numberValue(environment.RATE_LIMIT_MAX, 100, 1),
    AUTH_RATE_LIMIT_MAX: numberValue(environment.AUTH_RATE_LIMIT_MAX, 5, 1),
    RESET_RATE_LIMIT_MAX: numberValue(environment.RESET_RATE_LIMIT_MAX, 3, 1),
    SCANNER_RATE_LIMIT_MAX: numberValue(
      environment.SCANNER_RATE_LIMIT_MAX,
      60,
      1,
    ),
    ADMIN_RATE_LIMIT_MAX: numberValue(environment.ADMIN_RATE_LIMIT_MAX, 20, 1),
    PASSWORD_RESET_EXPIRES_MINUTES: numberValue(
      environment.PASSWORD_RESET_EXPIRES_MINUTES,
      30,
      5,
      1440,
    ),
    WIKIDATA_USER_AGENT: stringValue(
      environment.WIKIDATA_USER_AGENT,
      'StickerTrack/0.1 (administrative enrichment)',
    ),
    EXTERNAL_PROVIDER_TIMEOUT_MS: numberValue(
      environment.EXTERNAL_PROVIDER_TIMEOUT_MS,
      8_000,
      1_000,
      60_000,
    ),
    EXTERNAL_PROVIDER_RETRY_LIMIT: numberValue(
      environment.EXTERNAL_PROVIDER_RETRY_LIMIT,
      1,
      0,
      3,
    ),
    LOG_LEVEL: stringValue(environment.LOG_LEVEL, 'info'),
    SWAGGER_ENABLED:
      booleanValue(environment.SWAGGER_ENABLED, !production) || !production,
    CSV_MAX_BYTES: numberValue(
      environment.CSV_MAX_BYTES,
      2_000_000,
      1_024,
      10_000_000,
    ),
    CSV_MAX_ROWS: numberValue(environment.CSV_MAX_ROWS, 10_000, 1, 100_000),
  };
}

export function isAllowedCorsOrigin(
  origin: string | undefined,
  allowedOrigins: string[],
) {
  return !origin || allowedOrigins.includes(origin);
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function listValue(value: unknown, fallback: string[]) {
  if (typeof value !== 'string') return fallback;
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function numberValue(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error('An environment variable contains an invalid number.');
  }
  return parsed;
}

function booleanValue(value: unknown, fallback: boolean) {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  throw new Error('An environment variable contains an invalid boolean.');
}

function urlValue(value: unknown, fallback?: string) {
  const resolved = stringValue(value, fallback);
  if (!resolved) throw new Error('APP_URL is required in production.');
  return parseHttpUrl(resolved, 'APP_URL').toString().replace(/\/$/, '');
}

function parseHttpUrl(value: string, field: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${field} must contain valid URLs.`);
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`${field} must use HTTP or HTTPS.`);
  }
  return url;
}
