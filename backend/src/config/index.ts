
import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const parseInteger = (
  name: string,
  fallback: number,
  min: number,
  max: number
): number => {
  const value = process.env[name];

  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(
      `${name} must be an integer between ${min} and ${max}.`
    );
  }

  return parsed;
};

const jwtSecret =
  process.env.JWT_SECRET ||
  'secureorg_default_jwt_secret_must_be_changed_in_prod_32';

const encryptionKey =
  process.env.ENCRYPTION_KEY ||
  'b6eb90b5dd82021a5298df075f8b385495fbc8d5b119a578fc786880a5be1532';

const sessionSecret =
  process.env.SESSION_SECRET ||
  'default_session_secret_1234567890';

if (isProduction) {
  if (
    jwtSecret ===
    'secureorg_default_jwt_secret_must_be_changed_in_prod_32' ||
    Buffer.byteLength(jwtSecret, 'utf8') < 32
  ) {
    throw new Error('Production requires a strong JWT_SECRET of at least 32 bytes.');
  }

  if (
    sessionSecret === 'default_session_secret_1234567890' ||
    Buffer.byteLength(sessionSecret, 'utf8') < 32
  ) {
    throw new Error('Production requires a strong SESSION_SECRET of at least 32 bytes.');
  }

  if (
    encryptionKey ===
    'b6eb90b5dd82021a5298df075f8b385495fbc8d5b119a578fc786880a5be1532'
  ) {
    throw new Error('Production requires a separately configured ENCRYPTION_KEY.');
  }
}

if (!/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
  throw new Error(
    'ENCRYPTION_KEY must contain exactly 64 hexadecimal characters (32 bytes).'
  );
}

export const config = {
  port: parseInteger('PORT', 5000, 1, 65535),

  nodeEnv,

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/SecureOrg?schema=public',

  jwt: {
    secret: jwtSecret,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  crypto: {
    encryptionKey,
    sessionSecret,
  },

  security: {
    maxLoginAttempts: parseInteger(
      'MAX_LOGIN_ATTEMPTS',
      5,
      1,
      100
    ),

    lockoutDurationMinutes: parseInteger(
      'LOCKOUT_DURATION_MINUTES',
      15,
      1,
      1440
    ),

    cookieSecure: process.env.COOKIE_SECURE === 'true',

    bcryptSaltRounds: parseInteger(
      'BCRYPT_SALT_ROUNDS',
      12,
      10,
      15
    ),

    passwordMinLength: 12,

    mfaMaxAttempts: parseInteger(
      'MFA_MAX_ATTEMPTS',
      5,
      1,
      20
    ),

    mfaLockoutDurationMinutes: parseInteger(
      'MFA_LOCKOUT_DURATION_MINUTES',
      15,
      1,
      1440
    ),

    mfaChallengeExpiryMinutes: parseInteger(
      'MFA_CHALLENGE_EXPIRY_MINUTES',
      5,
      1,
      30
    ),

    mfaEnrollmentExpiryMinutes: parseInteger(
      'MFA_ENROLLMENT_EXPIRY_MINUTES',
      10,
      1,
      60
    ),
  },

  webauthn: {
    rpName: process.env.WEBAUTHN_RP_NAME || 'SecureOrg',
    rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
    origin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173',
  },
};
