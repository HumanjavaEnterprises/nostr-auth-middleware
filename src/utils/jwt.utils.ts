import jwt from 'jsonwebtoken';
import { createLogger } from './logger';

const logger = createLogger('JWTUtils');

export function generateJWT(pubkey: string, secret: string, expiresIn: string): string {
  try {
    return jwt.sign({ pubkey }, secret, { expiresIn });
  } catch (error) {
    logger.error('Error generating JWT:', { error: error instanceof Error ? error.message : String(error) });
    throw new Error('Failed to generate JWT');
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
