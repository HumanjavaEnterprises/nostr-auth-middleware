/**
 * @fileoverview Service layer for handling Nostr-related operations
 * Manages challenge creation, verification, and user enrollment with optional Supabase persistence
 */

import { NostrEvent, NostrProfile, NostrChallenge, NostrEnrollment, VerificationResult } from '../types.js';
import { createClient } from '@supabase/supabase-js';
import { validateEvent } from '../validators/event.validator.js';
import { createLogger } from '../utils/logger.js';
import { generateJWT } from '../utils/jwt.utils.js';
import { config } from '../config.js';

const logger = createLogger('NostrService');

/**
 * Service class for handling Nostr protocol operations
 * @class NostrService
 * @description Manages Nostr-specific operations including challenge-response authentication,
 * profile management, and user enrollment. Optionally integrates with Supabase for data persistence.
 */
export class NostrService {
  private supabase;
  private config;

  /**
   * Creates a new NostrService instance
   * @param {any} config - Configuration object containing Supabase credentials and other settings
   */
  constructor(config: any) {
    this.config = config;
    if (config.supabaseUrl && config.supabaseKey) {
      this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    }
  }

  /**
   * Creates a new challenge for a given public key
   * @param {string} pubkey - The public key to create a challenge for
   * @returns {Promise<NostrChallenge>} The created challenge
   * @throws {Error} If challenge creation fails
   */
  async createChallenge(pubkey: string): Promise<NostrChallenge> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const challenge: NostrChallenge = {
        id: Math.random().toString(36).substring(7),
        pubkey,
        challenge: `${this.config.challengePrefix}${now}`,
        created_at: now,
        expires_at: now + Math.floor(this.config.eventTimeoutMs / 1000)
      };

      if (this.supabase) {
        await this.supabase
          .from('challenges')
          .insert([challenge]);
      }

      return challenge;
    } catch (error) {
      logger.error('Error creating challenge:', error);
      throw new Error('Failed to create challenge');
    }
  }

  /**
   * Verifies a challenge response event
   * @param {NostrEvent} event - The event containing the challenge response
   * @returns {Promise<VerificationResult>} The verification result
   * @description Validates the event signature and checks if the challenge exists and hasn't expired
   */
  async verifyChallenge(event: NostrEvent): Promise<VerificationResult> {
    try {
      const validationResult = await validateEvent(event);
      if (!validationResult.success) {
        return { success: false, error: validationResult.error };
      }

      if (!this.supabase) {
        return { success: true, pubkey: event.pubkey };
      }

      const { data: challenge } = await this.supabase
        .from('challenges')
        .select()
        .eq('pubkey', event.pubkey)
        .eq('challenge', event.content)
        .single();

      if (!challenge) {
        return { success: false, error: 'Challenge not found' };
      }

      if (challenge.expires_at < Math.floor(Date.now() / 1000)) {
        return { success: false, error: 'Challenge expired' };
      }

      return { success: true, pubkey: event.pubkey };
    } catch (error) {
      logger.error('Error verifying challenge:', { error: error instanceof Error ? error.message : String(error) });
      return { success: false, error: 'Failed to verify challenge' };
    }
  }

  /**
   * Creates a new enrollment for a user
   * @param {string} pubkey - The public key of the user to enroll
   * @param {NostrProfile} profile - The user's Nostr profile
   * @returns {Promise<NostrEnrollment>} The created enrollment
   * @throws {Error} If enrollment creation fails
   */
  async createEnrollment(pubkey: string, profile: NostrProfile): Promise<NostrEnrollment> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const enrollment: NostrEnrollment = {
        id: Math.random().toString(36).substring(7),
        pubkey,
        profile,
        challenge: undefined,
        status: 'pending',
        created_at: now,
        updated_at: now
      };

      if (this.supabase) {
        await this.supabase
          .from('enrollments')
          .upsert([enrollment]);
      }

      return enrollment;
    } catch (error) {
      logger.error('Error creating enrollment:', { error: error instanceof Error ? error.message : String(error) });
      throw new Error('Failed to create enrollment');
    }
  }

  /**
   * Retrieves a user's profile by public key
   * @param {string} pubkey - The public key of the user to retrieve the profile for
   * @returns {Promise<NostrProfile | null>} The user's profile or null if not found
   */
  async getProfile(pubkey: string): Promise<NostrProfile | null> {
    try {
      if (!this.supabase) {
        return null;
      }

      const { data } = await this.supabase
        .from('enrollments')
        .select('profile')
        .eq('pubkey', pubkey)
        .single();

      return data?.profile || null;
    } catch (error) {
      logger.error('Error fetching profile:', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Generates a JSON Web Token (JWT) for a given public key
   * @param {string} pubkey - The public key to generate a JWT for
   * @returns {Promise<string>} The generated JWT
   * @throws {Error} If JWT generation fails
   */
  async generateToken(pubkey: string): Promise<string> {
    if (!this.config.jwtSecret) {
      throw new Error('JWT secret not configured');
    }

    return generateJWT(pubkey, this.config.jwtSecret, this.config.jwtExpiresIn);
  }
}
