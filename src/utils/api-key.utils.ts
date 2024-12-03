import { createHash, randomBytes } from 'crypto';
import { hexToBytes } from '@noble/hashes/utils';
import { getPublicKey } from './crypto.utils.js';
import { createLogger } from './logger.js';

const logger = createLogger('ApiKeyUtils');

interface ApiKeyParts {
  prefix: string;
  serverPubkey: string;
  secret: string;
}

/**
 * Generate a deterministic API key from a server's private key
 * Format: maqr_[first 8 chars of pubkey]_[32 chars of deterministic secret]
 */
export function generateApiKey(privateKey: string): string {
  try {
    // Get the server's public key
    const privateKeyBytes = hexToBytes(privateKey);
    const publicKey = getPublicKey(privateKeyBytes);
    
    // Create a deterministic secret using the private key
    const secret = createHash('sha256')
      .update(privateKeyBytes)
      .digest('hex')
      .slice(0, 32); // Take first 32 chars
    
    return formatApiKey({
      prefix: 'maqr',
      serverPubkey: publicKey.slice(0, 8),
      secret
    });
  } catch (error) {
    logger.error('Failed to generate API key:', error);
    throw new Error('Failed to generate API key');
  }
}

/**
 * Generate a new random API key
 * Useful for creating additional keys that aren't tied to the server identity
 */
export function generateRandomApiKey(): string {
  const randomSecret = randomBytes(16).toString('hex');
  const randomPubkey = randomBytes(4).toString('hex');
  
  return formatApiKey({
    prefix: 'maqr',
    serverPubkey: randomPubkey,
    secret: randomSecret
  });
}

/**
 * Format API key parts into a single string
 */
function formatApiKey(parts: ApiKeyParts): string {
  return `${parts.prefix}_${parts.serverPubkey}_${parts.secret}`;
}

/**
 * Parse an API key into its component parts
 * Returns null if the key format is invalid
 */
export function parseApiKey(apiKey: string): ApiKeyParts | null {
  const parts = apiKey.split('_');
  if (parts.length !== 3) return null;
  
  const [prefix, serverPubkey, secret] = parts;
  if (prefix !== 'maqr') return null;
  if (serverPubkey.length !== 8) return null;
  if (secret.length !== 32) return null;
  
  return { prefix, serverPubkey, secret };
}

/**
 * Validate an API key format
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  return parseApiKey(apiKey) !== null;
}
