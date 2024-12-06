/**
 * Main exports for the Nostr Auth Middleware package
 * @module @maiqr/nostr-auth-enroll
 */

// Core middleware
import { NostrAuthMiddleware } from './middleware/nostr-auth.middleware.js';
import type { NostrAuthConfig } from './types/index.js';

// Re-export middleware
export { NostrAuthMiddleware };

// Types
export type {
  NostrAuthConfig,
  NostrChallenge,
  NostrProfile,
  NostrEnrollment,
  VerificationResult
} from './types/index.js';

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
 * import { createNostrAuth } from '@maiqr/nostr-auth-enroll';
 * 
 * const nostrAuth = createNostrAuth({
 *   supabaseUrl: process.env.SUPABASE_URL,
 *   supabaseKey: process.env.SUPABASE_KEY,
 *   privateKey: process.env.SERVER_PRIVATE_KEY
 * });
 * 
 * app.use('/auth/nostr', nostrAuth.router);
 * ```
 */
export const createNostrAuth = (config: NostrAuthConfig): NostrAuthMiddleware => {
  return new NostrAuthMiddleware(config);
};

// Default export for CommonJS compatibility
export default NostrAuthMiddleware;
