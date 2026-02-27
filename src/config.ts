import { NostrAuthConfig, JWTExpiresIn } from './types.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger('Config');

function getEnvWithWarning(key: string): string {
  const value = process.env[key];
  if (!value) {
    logger.warn(`${key} not set in environment variables`);
    return '';
  }
  return value;
}

function validatePrivateKey(privateKey?: string): string | undefined {
  if (!privateKey) {
    return undefined;
  }

  try {
    // Validate hex format
    if (!/^[0-9a-f]{64}$/.test(privateKey)) {
      throw new Error('Invalid private key format');
    }
    return privateKey;
  } catch (error) {
    logger.error('Invalid SERVER_PRIVATE_KEY:', error);
    throw error;
  }
}

export const config: NostrAuthConfig = {
  keyManagementMode: process.env.KEY_MANAGEMENT_MODE === 'production' ? 'production' : 'development',
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  corsCredentials: process.env.CORS_CREDENTIALS === 'true',
  eventTimeoutMs: parseInt(process.env.EVENT_TIMEOUT_MS || '5000', 10),
  challengePrefix: process.env.CHALLENGE_PREFIX || 'nostr:auth:',
  testMode: process.env.TEST_MODE === 'true',
  logLevel: process.env.LOG_LEVEL || 'info',
  jwtSecret: (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('FATAL: JWT_SECRET environment variable is required');
    return secret;
  })(),
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '24h') as JWTExpiresIn,
  supabaseUrl: getEnvWithWarning('SUPABASE_URL'),
  supabaseKey: getEnvWithWarning('SUPABASE_KEY'),
  privateKey: validatePrivateKey(process.env.SERVER_PRIVATE_KEY),
  publicKey: process.env.SERVER_PUBLIC_KEY
};

export function validateConfig(config: NostrAuthConfig): void {
  if (!config) {
    throw new Error('Config is required');
  }

  if (!config.keyManagementMode) {
    throw new Error('keyManagementMode is required in config');
  }

  if (config.keyManagementMode === 'production') {
    if (!config.privateKey) {
      throw new Error('privateKey is required in production mode');
    }

    // Validate private key format
    if (!/^[0-9a-f]{64}$/.test(config.privateKey)) {
      throw new Error('Invalid private key format');
    }
  }

  // Log config (excluding sensitive values)
  const sanitizedConfig = {
    ...config,
    privateKey: config.privateKey ? '***' : undefined,
    jwtSecret: config.jwtSecret ? '***' : undefined,
    supabaseKey: config.supabaseKey ? '***' : undefined
  };

  logger.info('Config validated:', sanitizedConfig);
}

validateConfig(config);
