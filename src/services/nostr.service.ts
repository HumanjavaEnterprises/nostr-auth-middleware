import { NostrEvent, NostrProfile, NostrChallenge, NostrEnrollment, VerificationResult } from '../types.js';
import { createClient } from '@supabase/supabase-js';
import { validateEvent } from '../validators/event.validator.js';
import { createLogger } from '../utils/logger.js';
import { generateJWT } from '../utils/jwt.utils.js';
import { config } from '../config.js';

const logger = createLogger('NostrService');

export class NostrService {
  private supabase;
  private config;

  constructor(config: any) {
    this.config = config;
    if (config.supabaseUrl && config.supabaseKey) {
      this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    }
  }

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

  async generateToken(pubkey: string): Promise<string> {
    if (!this.config.jwtSecret) {
      throw new Error('JWT secret not configured');
    }

    return generateJWT(pubkey, this.config.jwtSecret, this.config.jwtExpiresIn);
  }
}
