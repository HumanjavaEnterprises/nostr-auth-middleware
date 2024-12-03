import dotenv from 'dotenv';
import { createLogger } from './utils/logger.js';
import { hexToBytes } from '@noble/hashes/utils';
import { getPublicKey } from './utils/crypto.utils.js';

dotenv.config();

const logger = createLogger('Config');

function getEnvWithWarning(key: string): string | undefined {
  const value = process.env[key];
  if (!value) {
    logger.warn(`Missing environment variable: ${key} - Some features may be limited`);
  }
  return value;
}

function validatePrivateKey(key: string | undefined): string {
  if (!key) {
    throw new Error('SERVER_PRIVATE_KEY is required');
  }
  try {
    // Validate key format
    if (!/^[0-9a-f]{64}$/.test(key)) {
      throw new Error('SERVER_PRIVATE_KEY must be a 64-character hex string');
    }
    // Test key derivation
    const privateKeyBytes = hexToBytes(key);
    const pubkey = getPublicKey(privateKeyBytes);
    logger.info('Server keys validated. Public key:', pubkey);
    return key;
  } catch (error) {
    logger.error('Invalid SERVER_PRIVATE_KEY:', error);
    throw error;
  }
}

export const config = {
  // Server config
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // CORS
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || '*',
  
  // Nostr config
  nostrRelays: process.env.NOSTR_RELAYS?.split(',') || [
    'wss://relay.damus.io',
    'wss://relay.nostr.band'
  ],
  
  // Supabase config - optional for testing
  supabaseUrl: getEnvWithWarning('SUPABASE_URL'),
  supabaseKey: getEnvWithWarning('SUPABASE_KEY'),
  
  // JWT config - optional for testing
  jwtSecret: getEnvWithWarning('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // Key Management Mode
  keyManagementMode: (process.env.KEY_MANAGEMENT_MODE === 'production' ? 'production' : 'development') as 'development' | 'production',
  
  // Server key pair - required and validated
  privateKey: validatePrivateKey(process.env.SERVER_PRIVATE_KEY),
  publicKey: process.env.SERVER_PUBLIC_KEY,
  
  // Testing mode - disables Supabase and JWT requirements
  testMode: process.env.TEST_MODE === 'true',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info'
} as const;
