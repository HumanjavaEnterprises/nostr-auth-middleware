/**
 * @fileoverview Service for handling Nostr authentication operations
 */

import { NostrEvent, NostrProfile, VerificationResult, NostrAuthConfig } from '../types.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateEvent } from '../validators/event.validator.js';
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
  }

  /**
   * Creates a challenge for a given public key
   * @param {string} pubkey - Public key to create challenge for
   * @returns {Promise<string>} Challenge string
   */
  async createChallenge(pubkey: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const challenge: SupabaseChallenge = {
      id: Math.random().toString(36).substring(7),
      challenge: `${this.config.challengePrefix || 'nostr-auth:'} ${Math.random().toString(36).substring(7)}`,
      created_at: now,
      expires_at: now + Math.floor(this.config.eventTimeoutMs / 1000),
      pubkey
    };

    if (this.supabase) {
      try {
        await this.supabase
          .from('challenges')
          .insert([challenge]);
      } catch (error) {
        logger.error('Failed to store challenge:', error);
      }
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
      const validationResult = await validateEvent(event);
      if (!validationResult.success) {
        return validationResult;
      }

      if (this.supabase) {
        // Check if challenge exists in database
        const { data } = await this.supabase
          .from('challenges')
          .select<'*', SupabaseChallenge>('*')
          .eq('pubkey', event.pubkey || '')
          .single();

        if (!data) {
          return { success: false, error: 'Challenge not found' };
        }

        const now = Math.floor(Date.now() / 1000);
        if (data.expires_at < now) {
          return { success: false, error: 'Challenge expired' };
        }

        // Delete used challenge
        await this.supabase
          .from('challenges')
          .delete()
          .eq('id', data.id);
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
