import { createLogger } from '../utils/logger.js';
import { generateKeyPair } from '../utils/crypto.utils.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';
import { NostrConfig } from '../types/index.js';

const logger = createLogger('Config');

export interface KeyConfig {
  privateKey: string;
  publicKey: string;
}

// Initialize config with default values
export const config: NostrConfig = {
  // Server config
  port: parseInt(process.env.PORT || '3002'),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || '*',
  security: {
    trustedProxies: process.env.TRUSTED_PROXIES?.split(',') || false,
    allowedIPs: process.env.ALLOWED_IPS?.split(',') || [],
    apiKeys: process.env.API_KEYS?.split(',') || [],
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  // Supabase config
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
  // Nostr config
  nostrRelays: process.env.NOSTR_RELAYS?.split(',') || [
    'wss://relay.maiqr.app',
    'wss://relay.damus.io',
    'wss://relay.nostr.band'
  ],
  privateKey: process.env.SERVER_PRIVATE_KEY,
  keyManagementMode: (process.env.KEY_MANAGEMENT_MODE as 'development' | 'production') || 'development',
  // Auth config
  jwtSecret: process.env.JWT_SECRET || 'maiqr_nostr_auth_secret_key_2024',
  jwtExpiresIn: '1h',
  testMode: process.env.TEST_MODE === 'true',
  // Optional configs
  eventTimeoutMs: 5000,
  challengePrefix: 'nostr:auth:'
};

export async function loadConfig(envPath?: string): Promise<NostrConfig> {
  // Load environment variables
  if (envPath) {
    dotenv.config({ path: envPath });
  } else {
    dotenv.config();
  }

  const loadedConfig: NostrConfig = {
    // Server config
    port: parseInt(process.env.PORT || '3002'),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || '*',
    security: {
      trustedProxies: process.env.TRUSTED_PROXIES?.split(',') || false,
      allowedIPs: process.env.ALLOWED_IPS?.split(',') || [],
      apiKeys: process.env.API_KEYS?.split(',') || [],
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    },
    // Supabase config
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
    // Nostr config
    nostrRelays: process.env.NOSTR_RELAYS?.split(',') || [
      'wss://relay.maiqr.app',
      'wss://relay.damus.io',
      'wss://relay.nostr.band'
    ],
    privateKey: process.env.SERVER_PRIVATE_KEY,
    publicKey: process.env.SERVER_PUBLIC_KEY,
    keyManagementMode: process.env.KEY_MANAGEMENT_MODE as 'development' | 'production',
    // Auth config
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    testMode: process.env.NODE_ENV !== 'production',
    // Optional configs
    eventTimeoutMs: parseInt(process.env.EVENT_TIMEOUT_MS || '5000'),
    challengePrefix: process.env.CHALLENGE_PREFIX || 'nostr:auth:'
  };

  // Try to load keys from environment
  if (process.env.SERVER_PRIVATE_KEY) {
    const keyPair = await generateKeyPair();
    loadedConfig.privateKey = process.env.SERVER_PRIVATE_KEY;
    loadedConfig.publicKey = keyPair.publicKey;
    logger.info('Loaded server keys from environment');
    return loadedConfig;
  }

  // If in production, try to load from Supabase
  if (!loadedConfig.testMode && loadedConfig.supabaseUrl && loadedConfig.supabaseKey) {
    const supabase = createClient(loadedConfig.supabaseUrl, loadedConfig.supabaseKey);
    try {
      const { data, error } = await supabase
        .from('server_keys')
        .select('private_key, public_key')
        .single();

      if (error) throw error;
      if (data) {
        loadedConfig.privateKey = data.private_key;
        loadedConfig.publicKey = data.public_key;
        logger.info('Loaded server keys from Supabase');
        return loadedConfig;
      }
    } catch (error) {
      logger.warn('Failed to load keys from Supabase:', error);
    }
  }

  // Generate new keys if none exist
  logger.warn('No server keys found - generating new keypair');
  const keyPair = await generateKeyPair();
  loadedConfig.privateKey = Buffer.from(keyPair.privateKey).toString('hex');
  loadedConfig.publicKey = keyPair.publicKey;

  // Save to .env file in development
  if (loadedConfig.testMode) {
    try {
      const envPath = resolve(process.cwd(), '.env');
      const envContent = readFileSync(envPath, 'utf8');
      const updatedContent = envContent
        .replace(/^SERVER_PRIVATE_KEY=.*$/m, `SERVER_PRIVATE_KEY=${loadedConfig.privateKey}`)
        .replace(/^SERVER_PUBLIC_KEY=.*$/m, `SERVER_PUBLIC_KEY=${loadedConfig.publicKey}`);
      writeFileSync(envPath, updatedContent);
      logger.info('Saved new server keys to .env file');
    } catch (error) {
      logger.warn('Failed to save keys to .env file:', error);
    }
  }

  // Save to Supabase in production
  else if (loadedConfig.supabaseUrl && loadedConfig.supabaseKey) {
    const supabase = createClient(loadedConfig.supabaseUrl, loadedConfig.supabaseKey);
    try {
      const { error } = await supabase
        .from('server_keys')
        .upsert({
          private_key: loadedConfig.privateKey,
          public_key: loadedConfig.publicKey
        });
      if (error) throw error;
      logger.info('Saved new server keys to Supabase');
    } catch (error) {
      logger.warn('Failed to save keys to Supabase:', error);
    }
  }

  return loadedConfig;
}
