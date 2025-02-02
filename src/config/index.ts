/**
 * @fileoverview Configuration management for the Nostr Auth Middleware
 * Handles loading and managing configuration from environment variables and external sources
 * @module config
 */

import { createLogger } from '../utils/logger.js';
import { generateKeyPair } from '../utils/crypto.utils.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';
import { NostrConfig } from '../types/index.js';

const logger = createLogger('Config');

/**
 * Interface for key pair configuration
 * @interface KeyConfig
 */
export interface KeyConfig {
  /** Private key in hex format */
  privateKey: string;
  /** Public key in hex format */
  publicKey: string;
}

/**
 * Default configuration object
 * @type {NostrConfig}
 * @description
 * Contains default values for all configuration options.
 * Values can be overridden by environment variables.
 */
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

/**
 * Loads configuration from environment variables and external sources
 * @param {string} [envPath] - Optional path to .env file
 * @returns {Promise<NostrConfig>} Loaded configuration object
 * @throws {Error} If required configuration is missing or invalid
 * @description
 * Configuration loading process:
 * 1. Load environment variables from .env file if provided
 * 2. Load server keys from environment or generate new ones
 * 3. In production, attempt to load keys from Supabase
 * 4. Apply defaults for missing values
 * @security
 * - Ensure JWT_SECRET is properly set in production
 * - Never commit .env files or hard-coded secrets
 * - Use secure key management in production
 */
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
    loadedConfig.publicKey = keyPair.publicKey.toString();
    logger.info('Loaded server keys from environment');
    return loadedConfig;
  }

  // If in production, try to load from Supabase
  if (!loadedConfig.testMode && loadedConfig.supabaseUrl && loadedConfig.supabaseKey) {
    const supabase = createClient(loadedConfig.supabaseUrl, loadedConfig.supabaseKey);
    try {
      const { data: keys } = await supabase
        .from('server_keys')
        .select('private_key, public_key')
        .single();

      if (keys) {
        loadedConfig.privateKey = keys.private_key;
        loadedConfig.publicKey = keys.public_key;
        logger.info('Loaded server keys from Supabase');
        return loadedConfig;
      }
    } catch (error) {
      logger.error('Failed to load keys from Supabase:', error);
    }
  }

  // Generate new keys if none exist
  if (!loadedConfig.privateKey || !loadedConfig.publicKey) {
    const keyPair = await generateKeyPair();
    loadedConfig.privateKey = keyPair.privateKey.toString();
    loadedConfig.publicKey = keyPair.publicKey.toString();
    logger.info('Generated new server keys');

    // Save to Supabase if available
    if (!loadedConfig.testMode && loadedConfig.supabaseUrl && loadedConfig.supabaseKey) {
      const supabase = createClient(loadedConfig.supabaseUrl, loadedConfig.supabaseKey);
      try {
        await supabase
          .from('server_keys')
          .insert([{ private_key: loadedConfig.privateKey, public_key: loadedConfig.publicKey }]);
        logger.info('Saved new server keys to Supabase');
      } catch (error) {
        logger.error('Failed to save keys to Supabase:', error);
      }
    }
  }

  return loadedConfig;
}
