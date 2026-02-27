/**
 * @fileoverview API Key utilities for authentication and authorization
 * Provides functions for generating, hashing, and validating API keys
 * @module api-key-utils
 * @security This module is critical for API security. Handle keys with care.
 */

import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { createLogger } from './logger.js';

const logger = createLogger('APIKeyUtils');

/**
 * Generates a random API key
 * @param {number} [length=32] - Length of the key in bytes (resulting hex string will be twice this length)
 * @returns {string} Generated API key in hex format
 * @throws {Error} If key generation fails
 * @security Uses cryptographically secure random number generator
 */
export function generateApiKey(length: number = 32): string {
  try {
    return randomBytes(length).toString('hex');
  } catch (error) {
    logger.error('Error generating API key:', { error: error instanceof Error ? error.message : String(error) });
    throw new Error('Failed to generate API key');
  }
}

/**
 * Generates a deterministic API key for a user
 * @param {string} userId - Unique identifier for the user
 * @param {string} secret - Secret key for generating the API key
 * @returns {string} Generated API key in format: userId_timestamp_hash
 * @throws {Error} If key generation fails
 * @security
 * - Keep the secret key secure and never expose it
 * - The resulting key includes a timestamp to enable key rotation
 */
export function generateApiKeyForUser(userId: string, secret: string): string {
  try {
    const timestamp = Date.now().toString();
    const data = `${userId}:${timestamp}:${secret}`;
    const hash = createHash('sha256').update(data).digest('hex');
    // SECURITY: Use the full SHA-256 hash (64 hex chars = 256 bits) for proper entropy.
    // Previously used only 8 chars (32 bits) which is vulnerable to brute-force.
    return `${userId}_${timestamp}_${hash}`;
  } catch (error) {
    logger.error('Error generating API key for user:', { error: error instanceof Error ? error.message : String(error) });
    throw new Error('Failed to generate API key for user');
  }
}

/**
 * Creates a SHA-256 hash of an API key
 * @param {string} apiKey - The API key to hash
 * @returns {string} Hashed API key in hex format
 * @throws {Error} If hashing fails
 * @security
 * - Store only hashed API keys in the database
 * - Never log or expose original API keys
 */
export function hashApiKey(apiKey: string): string {
  try {
    return createHash('sha256')
      .update(apiKey)
      .digest('hex');
  } catch (error) {
    logger.error('Error hashing API key:', { error: error instanceof Error ? error.message : String(error) });
    throw new Error('Failed to hash API key');
  }
}

/**
 * Verifies an API key against its hash
 * @param {string} apiKey - The API key to verify
 * @param {string} hashedApiKey - The expected hash of the API key
 * @returns {boolean} True if the API key matches the hash
 * @security
 * - Use constant-time comparison to prevent timing attacks
 * - Handle failures gracefully without exposing error details
 */
export function verifyApiKey(apiKey: string, hashedApiKey: string): boolean {
  try {
    const hash = hashApiKey(apiKey);
    try {
      return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashedApiKey, 'hex'));
    } catch {
      return false;
    }
  } catch (error) {
    logger.error('Error verifying API key:', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

/**
 * Parses a user API key into its components
 * @param {string} apiKey - The API key to parse (format: userId_timestamp_hash)
 * @returns {{ userId: string; timestamp: string; hash: string } | null} Parsed components or null if invalid
 * @example
 * const apiKey = "user123_1643673600000_a1b2c3d4e5f6...";
 * const result = parseApiKey(apiKey);
 * // result = { userId: "user123", timestamp: "1643673600000", hash: "a1b2c3d4e5f6..." }
 */
export function parseApiKey(apiKey: string): { userId: string; timestamp: string; hash: string } | null {
  try {
    const parts = apiKey.split('_');
    if (parts.length !== 3) {
      return null;
    }

    const [userId, timestamp, hash] = parts;
    if (!userId || !timestamp || !hash) {
      return null;
    }

    return { userId, timestamp, hash };
  } catch (error) {
    logger.error('Error parsing API key:', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Checks if an API key has valid format
 * @param {string} apiKey - The API key to validate
 * @returns {boolean} True if the API key format is valid
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  return parseApiKey(apiKey) !== null;
}
