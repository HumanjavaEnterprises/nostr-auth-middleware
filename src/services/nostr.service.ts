/**
 * @fileoverview Service for handling Nostr authentication operations
 */

import crypto from 'crypto';
import { NostrEvent, NostrProfile, VerificationResult, NostrAuthConfig } from '../types.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateChallengeEvent, getChallengeTagValue } from '../validators/event.validator.js';
import { createLogger } from '../utils/logger.js';
import { generateJWT } from '../utils/jwt.utils.js';

const logger = createLogger('NostrService');

const DEFAULT_EVENT_TIMEOUT_MS = 300000; // 5 minutes
const DEFAULT_JWT_EXPIRES_IN = '1h' as const;

type SupabaseChallenge = {
  id: string;
  challenge: string;
  created_at: number;
  expires_at: number;
  pubkey: string;
};

export class NostrService {
  private readonly config: NostrAuthConfig;
  private readonly supabase?: SupabaseClient;
  private challengeStore: Map<string, { challenge: string; pubkey: string; createdAt: number }> = new Map();
  private cleanupInterval?: ReturnType<typeof setInterval>;

  constructor(config: NostrAuthConfig) {
    // Set default values for required properties
    this.config = {
      ...config,
      eventTimeoutMs: config.eventTimeoutMs || DEFAULT_EVENT_TIMEOUT_MS,
      jwtExpiresIn: config.jwtExpiresIn || DEFAULT_JWT_EXPIRES_IN,
      jwtSecret: config.jwtSecret // This must be provided
    };

    if (!this.config.jwtSecret) {
      throw new Error('JWT secret is required');
    }

    if (config.supabaseUrl && config.supabaseKey) {
      this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    }

    // Periodically clean up expired challenges from in-memory store (every 60 seconds)
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [id, entry] of this.challengeStore) {
        if (now - entry.createdAt > this.config.eventTimeoutMs) {
          this.challengeStore.delete(id);
        }
      }
    }, 60000);
  }

  /**
   * Stops the periodic cleanup interval (for graceful shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Creates a challenge for a given public key
   * @param {string} pubkey - Public key to create challenge for
   * @returns {Promise<string>} Challenge string
   */
  async createChallenge(pubkey: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const challenge: SupabaseChallenge = {
      id: crypto.randomBytes(32).toString('hex'),
      challenge: `${this.config.challengePrefix || 'nostr-auth:'} ${crypto.randomBytes(32).toString('hex')}`,
      created_at: now,
      expires_at: now + Math.floor(this.config.eventTimeoutMs / 1000),
      pubkey
    };

    if (this.supabase) {
      try {
        // Clear any prior live challenges for this pubkey so at most one exists.
        // Without this, a second challenge request (reload / retry / double-click)
        // leaves multiple rows and the .single() lookup in verifyChallenge errors,
        // permanently locking the user out until the stale rows expire.
        await this.supabase
          .from('challenges')
          .delete()
          .eq('pubkey', pubkey);

        await this.supabase
          .from('challenges')
          .insert([challenge]);
      } catch (error) {
        logger.error('Failed to store challenge:', error);
      }
    } else {
      // Store in in-memory challenge store as fallback.
      // Clear any prior live challenges for this pubkey (single live challenge).
      for (const [id, entry] of this.challengeStore) {
        if (entry.pubkey === pubkey) {
          this.challengeStore.delete(id);
        }
      }
      this.challengeStore.set(challenge.id, {
        challenge: challenge.challenge,
        pubkey,
        createdAt: Date.now()
      });
    }

    return challenge.challenge;
  }

  /**
   * Verifies a signed challenge
   * @param {NostrEvent} event - Signed event containing the challenge
   * @returns {Promise<VerificationResult>} Verification result
   */
  async verifyChallenge(event: NostrEvent): Promise<VerificationResult> {
    try {
      // SECURITY: Enforce the full challenge-event contract before trusting the
      // event — correct kind (default 22242), a ['challenge', nonce] tag, id/hash
      // integrity, valid signature, and a fresh timestamp. The old path called the
      // generic validateEvent (no kind / tag / id check), so ANY signed event from
      // the target pubkey (a kind-1 note, a DM, ...) was accepted, and the Supabase
      // branch never compared the signed challenge to the issued one at all —
      // an unauthenticated account-takeover / replay.
      const expectedKind = this.config.customKind ?? 22242;
      const isValidChallengeEvent = await validateChallengeEvent(event, expectedKind);
      if (!isValidChallengeEvent) {
        return { success: false, error: 'Invalid challenge event' };
      }

      // Bind the signed event to a specific issued challenge via its challenge tag.
      const signedChallenge = getChallengeTagValue(event);
      if (!signedChallenge) {
        return { success: false, error: 'Missing challenge tag' };
      }

      if (this.supabase) {
        // Look up the issued challenge for this pubkey and require the signed
        // challenge nonce to match exactly. maybeSingle() (not single()) so a
        // stray extra row does not throw and lock the user out.
        const { data } = await this.supabase
          .from('challenges')
          .select<'*', SupabaseChallenge>('*')
          .eq('pubkey', event.pubkey || '')
          .eq('challenge', signedChallenge)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!data) {
          return { success: false, error: 'Challenge not found' };
        }

        const now = Math.floor(Date.now() / 1000);
        if (data.expires_at < now) {
          // Clear the expired challenge so it cannot be retried.
          await this.supabase.from('challenges').delete().eq('id', data.id);
          return { success: false, error: 'Challenge expired' };
        }

        // Delete used challenge (single-use)
        await this.supabase
          .from('challenges')
          .delete()
          .eq('id', data.id);
      } else {
        // Verify against in-memory challenge store: match the issued challenge
        // nonce (challenge tag) for this pubkey.
        let matchedId: string | null = null;

        for (const [id, entry] of this.challengeStore) {
          if (entry.challenge === signedChallenge && entry.pubkey === event.pubkey) {
            // Check if challenge has expired (TTL)
            if (Date.now() - entry.createdAt > this.config.eventTimeoutMs) {
              this.challengeStore.delete(id);
              return { success: false, error: 'Challenge expired' };
            }
            matchedId = id;
            break;
          }
        }

        if (!matchedId) {
          return { success: false, error: 'Challenge not found' };
        }

        // Delete used challenge (single-use)
        this.challengeStore.delete(matchedId);
      }

      return {
        success: true,
        pubkey: event.pubkey
      };
    } catch (error) {
      logger.error('Error verifying challenge:', error);
      return {
        success: false,
        error: 'Internal verification error'
      };
    }
  }

  /**
   * Generates a JWT token for a verified public key
   * @param {string} pubkey - Public key to generate token for
   * @returns {Promise<string>} JWT token
   */
  async generateToken(pubkey: string): Promise<string> {
    // Cast the expiration time to the correct type
    const expiresIn = this.config.jwtExpiresIn as `${number}h` | `${number}m` | `${number}s` | `${number}d`;
    return generateJWT(pubkey, this.config.jwtSecret, expiresIn);
  }

  /**
   * Retrieves a user's profile
   * @param {string} pubkey - Public key to fetch profile for
   * @returns {Promise<NostrProfile | null>} User profile or null if not found
   */
  async getProfile(pubkey: string): Promise<NostrProfile | null> {
    if (!this.supabase) {
      return null;
    }

    try {
      const { data } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('pubkey', pubkey)
        .single();

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        pubkey: data.pubkey,
        name: data.name,
        about: data.about,
        picture: data.picture,
        created_at: data.created_at,
        updated_at: data.updated_at
      } as NostrProfile;
    } catch (error) {
      logger.error('Error fetching profile:', error);
      return null;
    }
  }
}
