import dotenv from 'dotenv';
import { createLogger } from './utils/logger';

dotenv.config();

const logger = createLogger('Config');

function getEnvWithWarning(key: string): string | undefined {
  const value = process.env[key];
  if (!value) {
    logger.warn(`Missing environment variable: ${key} - Some features may be limited`);
  }
  return value;
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
  
  // Server key pair - optional
  privateKey: process.env.SERVER_PRIVATE_KEY,
  
  // Testing mode - disables Supabase and JWT requirements
  testMode: process.env.TEST_MODE === 'true',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info'
} as const;
