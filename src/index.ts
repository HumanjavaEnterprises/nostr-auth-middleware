/**
 * Main exports for the Nostr Auth Middleware package
 * @module @humanjavaenterprises/nostr-auth-middleware
 */

// Core middleware
import { NostrAuthMiddleware } from './middleware/nostr-auth.middleware.js';
import { Nip46SignerMiddleware } from './middleware/nip46-signer.middleware.js';
import type { NostrAuthConfig, JWTExpiresIn, Nip46SignerConfig } from './types.js';

// Re-export middleware
export { NostrAuthMiddleware };
export { Nip46SignerMiddleware };

// Types
export type {
  NostrAuthConfig,
  NostrChallenge,
  NostrProfile,
  NostrEnrollment,
  VerificationResult,
  JWTExpiresIn,
  Nip46AuthConfig,
  Nip46SignerConfig,
  Nip46AuthResult,
} from './types.js';

export type { NostrEvent } from './utils/types.js';

// Crypto utilities
export {
  generateChallenge,
  generateEventHash,
  getPublicKey,
  verifySignature
} from './utils/crypto.utils.js';

// Services
export { NostrService } from './services/nostr.service.js';

// Validators
export { validateEvent, validateChallengeEvent, validateEnrollmentEvent } from './validators/event.validator.js';

// Configuration
export { config } from './config.js';

/**
 * Create and configure a new Nostr Auth Middleware instance
 * @param config Configuration options for the middleware
 * @returns Configured NostrAuthMiddleware instance
 * 
 * @example
 * ```typescript
 * import { createNostrAuth } from '@humanjavaenterprises/nostr-auth-middleware';
 * 
 * const nostrAuth = createNostrAuth({
 *   supabaseUrl: process.env.SUPABASE_URL,
 *   supabaseKey: process.env.SUPABASE_KEY,
 *   privateKey: process.env.SERVER_PRIVATE_KEY,
 *   port: 3000,
 *   keyManagementMode: 'local'
 * });
 * 
 * app.use('/auth/nostr', nostrAuth.router);
 * ```
 */
export const createNostrAuth = (config: NostrAuthConfig): NostrAuthMiddleware => {
  // Ensure jwtExpiresIn is properly typed
  const typedConfig: NostrAuthConfig = {
    ...config,
    jwtExpiresIn: config.jwtExpiresIn as JWTExpiresIn
  };
  return new NostrAuthMiddleware(typedConfig);
};

/**
 * Create and configure a new NIP-46 Signer Middleware instance
 * @param config - Configuration for the signer
 * @param handlers - Callback handlers for NIP-46 methods
 * @returns Configured Nip46SignerMiddleware instance
 */
export const createNip46Signer = (
  config: Nip46SignerConfig,
  handlers: import('nostr-crypto-utils/nip46').Nip46SignerHandlers
): Nip46SignerMiddleware => {
  return new Nip46SignerMiddleware(config, handlers);
};

// Default export
export default NostrAuthMiddleware;
