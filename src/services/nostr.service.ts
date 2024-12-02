import { Event } from 'nostr-tools';
import { NostrAuthConfig, NostrChallenge, NostrEnrollment, NostrProfile, VerificationResult } from '../types';
import { createLogger } from '../utils/logger';
import { generateChallenge, generateEventHash, signEvent } from '../utils/crypto.utils';
import { NostrEventValidator } from '../validators/event.validator';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export class NostrService {
  private readonly logger = createLogger('NostrService');
  private readonly challenges: Map<string, NostrChallenge> = new Map();
  private readonly enrollments: Map<string, NostrEnrollment> = new Map();
  private readonly validator: NostrEventValidator;
  private readonly supabase?: SupabaseClient;
  private readonly profiles: Map<string, NostrProfile> = new Map();

  constructor(private readonly config: NostrAuthConfig) {
    this.validator = new NostrEventValidator();
    this.config.eventTimeoutMs = this.config.eventTimeoutMs || 5000;
    this.config.challengePrefix = this.config.challengePrefix || 'nostr:auth:';
    
    // Initialize Supabase if configured
    if (this.config.supabaseUrl && this.config.supabaseKey && !this.config.testMode) {
      this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey);
      this.logger.info('Supabase client initialized');
    } else {
      this.logger.warn('Running without Supabase - using in-memory storage');
    }
  }

  /**
   * Create a challenge event for authentication
   */
  async createChallenge(pubkey: string): Promise<NostrChallenge> {
    try {
      const challengeString = generateChallenge();
      const created_at = Math.floor(Date.now() / 1000);
      const expiresAt = created_at + 300; // 5 minutes

      const event: Event = {
        kind: 22242, // Challenge event kind
        created_at,
        tags: [
          ['p', pubkey],
          ['challenge', challengeString]
        ],
        content: `${this.config.challengePrefix}${challengeString}`,
        pubkey: '', // Will be set by the server
        id: '', // Will be computed
        sig: '' // Will be signed by the server
      };

      // Sign the event with server's key
      event.id = generateEventHash(event);
      if (this.config.privateKey) {
        event.sig = await signEvent(event, this.config.privateKey);
      }

      return {
        id: challengeString,
        event,
        expiresAt
      };
    } catch (error) {
      this.logger.error('Failed to create challenge:', error);
      throw new Error('Failed to create challenge');
    }
  }

  /**
   * Verify a signed challenge response
   */
  async verifyChallenge(challenge: NostrChallenge, signedEvent: Event): Promise<VerificationResult> {
    try {
      // Check if challenge has expired
      if (Date.now() / 1000 > challenge.expiresAt) {
        return {
          success: false,
          message: 'Challenge has expired'
        };
      }

      // Validate event format and signature
      if (!await this.validator.validateChallengeEvent(signedEvent)) {
        return {
          success: false,
          message: 'Invalid event format or signature'
        };
      }

      // Verify challenge response
      const challengeTag = signedEvent.tags.find(t => t[0] === 'challenge');
      if (!challengeTag || challengeTag[1] !== challenge.id) {
        return {
          success: false,
          message: 'Invalid challenge response'
        };
      }

      // Fetch profile if verification successful
      const profile = await this.fetchProfile(signedEvent.pubkey);

      return {
        success: true,
        profile,
        token: this.generateToken(signedEvent.pubkey)
      };
    } catch (error) {
      this.logger.error('Challenge verification failed:', error);
      return {
        success: false,
        message: 'Verification failed'
      };
    }
  }

  /**
   * Start enrollment process for a new user
   */
  async startEnrollment(pubkey: string): Promise<NostrEnrollment> {
    try {
      const created_at = Math.floor(Date.now() / 1000);
      const expiresAt = created_at + 300; // 5 minutes

      const event: Event = {
        kind: 22243, // Enrollment event kind
        created_at,
        tags: [
          ['p', pubkey],
          ['action', 'enroll']
        ],
        content: 'Enrollment verification request',
        pubkey: '', // Will be set by the server
        id: '', // Will be computed
        sig: '' // Will be signed by the server
      };

      // Sign the event with server's key
      event.id = generateEventHash(event);
      if (this.config.privateKey) {
        event.sig = await signEvent(event, this.config.privateKey);
      }

      const enrollment: NostrEnrollment = this.createEnrollment(event);

      this.enrollments.set(pubkey, enrollment);
      return enrollment;
    } catch (error) {
      this.logger.error('Failed to start enrollment:', error);
      throw new Error('Failed to start enrollment');
    }
  }

  /**
   * Verify enrollment response
   */
  async verifyEnrollment(signedEvent: Event): Promise<VerificationResult> {
    try {
      // Validate event format and signature
      if (!await this.validator.validateEnrollmentEvent(signedEvent)) {
        return {
          success: false,
          message: 'Invalid event format or signature'
        };
      }

      const enrollment = this.enrollments.get(signedEvent.pubkey);
      if (!enrollment) {
        return {
          success: false,
          message: 'No enrollment found for this pubkey'
        };
      }

      if (Date.now() / 1000 > enrollment.expiresAt) {
        this.enrollments.delete(signedEvent.pubkey);
        return {
          success: false,
          message: 'Enrollment has expired'
        };
      }

      // Store enrollment in storage
      const stored = await this.storeEnrollment(signedEvent.pubkey);
      if (!stored) {
        return {
          success: false,
          message: 'Failed to store enrollment'
        };
      }

      this.enrollments.delete(signedEvent.pubkey);
      return {
        success: true,
        token: this.generateToken(signedEvent.pubkey)
      };
    } catch (error) {
      this.logger.error('Enrollment verification failed:', error);
      return {
        success: false,
        message: 'Verification failed'
      };
    }
  }

  /**
   * Fetch user profile from storage
   */
  async fetchProfile(pubkey: string): Promise<NostrProfile> {
    try {
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('nostr_profiles')
          .select('*')
          .eq('pubkey', pubkey)
          .single();

        if (error) {
          throw error;
        }

        return data || { pubkey };
      } else {
        // Use in-memory storage for testing
        return this.profiles.get(pubkey) || { pubkey };
      }
    } catch (error) {
      this.logger.error('Failed to fetch profile:', error);
      return { pubkey };
    }
  }

  /**
   * Store enrollment in storage
   */
  private async storeEnrollment(pubkey: string): Promise<boolean> {
    try {
      if (this.supabase) {
        const { error } = await this.supabase
          .from('nostr_enrollments')
          .insert({
            pubkey,
            enrolled_at: new Date().toISOString()
          });

        if (error) {
          throw error;
        }
      } else {
        // Use in-memory storage for testing
        this.profiles.set(pubkey, { 
          pubkey,
          enrolled_at: new Date().toISOString()
        });
      }
      return true;
    } catch (error) {
      this.logger.error('Failed to store enrollment:', error);
      return false;
    }
  }

  private createEnrollment(signedEvent: Event): NostrEnrollment {
    return {
      pubkey: signedEvent.pubkey,
      verificationEvent: signedEvent,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      enrolled_at: new Date().toISOString()
    };
  }

  /**
   * Generate a JWT token for the authenticated user
   */
  private generateToken(pubkey: string): string {
    if (!this.config.jwtSecret && !this.config.testMode) {
      throw new Error('JWT secret is required');
    }

    if (this.config.testMode) {
      return `test_token_${pubkey}`;
    }

    return jwt.sign(
      { pubkey },
      this.config.jwtSecret!,
      { expiresIn: '24h' }
    );
  }
}
