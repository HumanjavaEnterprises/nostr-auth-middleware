import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { createLogger } from './logger.js';

const logger = createLogger('JWTUtils');

type JWTExpiresIn = `${number}h` | `${number}m` | `${number}s` | `${number}d`;

export function generateJWT(pubkey: string, secret: string, expiresIn: JWTExpiresIn): string {
  try {
    return jwt.sign({ pubkey }, secret, { expiresIn });
  } catch (error) {
    logger.error('Error generating JWT:', error);
    throw error;
  }
}

export function verifyJWT(token: string, secret: string): { pubkey: string } {
  try {
    const decoded = jwt.verify(token, secret) as { pubkey: string };
    return decoded;
  } catch (error) {
    logger.error('Error verifying JWT:', { error: error instanceof Error ? error.message : String(error) });
    throw new Error('Invalid JWT');
  }
}
