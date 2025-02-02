/**
 * @fileoverview JSON Web Token (JWT) utilities for authentication
 * Provides functions for generating and verifying JWTs with Nostr public keys
 * @module jwt-utils
 */

import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { createLogger } from './logger.js';

const logger = createLogger('JWTUtils');

/**
 * Type for JWT expiration time format
 * @typedef {`${number}h` | `${number}m` | `${number}s` | `${number}d`} JWTExpiresIn
 * @example
 * const expiresIn: JWTExpiresIn = '24h'; // 24 hours
 * const expiresIn: JWTExpiresIn = '30m'; // 30 minutes
 * const expiresIn: JWTExpiresIn = '7d';  // 7 days
 */
type JWTExpiresIn = `${number}h` | `${number}m` | `${number}s` | `${number}d`;

/**
 * Generates a JWT token for a given public key
 * @param {string} pubkey - The Nostr public key to encode in the token
 * @param {string} secret - The secret key used to sign the token
 * @param {JWTExpiresIn} expiresIn - Token expiration time (e.g., '24h', '60m')
 * @returns {string} The generated JWT token
 * @throws {Error} If token generation fails
 * @example
 * const token = generateJWT('npub1...', 'secret123', '24h');
 */
export function generateJWT(pubkey: string, secret: string, expiresIn: JWTExpiresIn): string {
  try {
    return jwt.sign({ pubkey }, secret, { expiresIn });
  } catch (error) {
    logger.error('Error generating JWT:', error);
    throw error;
  }
}

/**
 * Verifies a JWT token and extracts the public key
 * @param {string} token - The JWT token to verify
 * @param {string} secret - The secret key used to verify the token
 * @returns {{ pubkey: string }} Object containing the verified public key
 * @throws {Error} If token verification fails or token is invalid
 * @example
 * try {
 *   const { pubkey } = verifyJWT('eyJhbG...', 'secret123');
 *   console.log('Valid token for pubkey:', pubkey);
 * } catch (error) {
 *   console.error('Invalid token');
 * }
 */
export function verifyJWT(token: string, secret: string): { pubkey: string } {
  try {
    const decoded = jwt.verify(token, secret) as { pubkey: string };
    return decoded;
  } catch (error) {
    logger.error('Error verifying JWT:', { error: error instanceof Error ? error.message : String(error) });
    throw new Error('Invalid JWT');
  }
}
