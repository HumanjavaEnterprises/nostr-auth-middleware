import { createHash, randomBytes } from 'crypto';
import { createLogger } from './logger';

const logger = createLogger('APIKeyUtils');

export function generateApiKey(length: number = 32): string {
  try {
    return randomBytes(length).toString('hex');
  } catch (error) {
    logger.error('Error generating API key:', { error: error instanceof Error ? error.message : String(error) });
    throw new Error('Failed to generate API key');
  }
}

export function generateApiKeyForUser(userId: string, secret: string): string {
  try {
    const timestamp = Date.now().toString();
    const data = `${userId}:${timestamp}:${secret}`;
    const hash = createHash('sha256').update(data).digest('hex');
    return `${userId}_${timestamp}_${hash.substring(0, 8)}`;
  } catch (error) {
    logger.error('Error generating API key for user:', { error: error instanceof Error ? error.message : String(error) });
    throw new Error('Failed to generate API key for user');
  }
}

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

export function verifyApiKey(apiKey: string, hashedApiKey: string): boolean {
  try {
    const hash = hashApiKey(apiKey);
    return hash === hashedApiKey;
  } catch (error) {
    logger.error('Error verifying API key:', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

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

export function isValidApiKeyFormat(apiKey: string): boolean {
  return parseApiKey(apiKey) !== null;
}
