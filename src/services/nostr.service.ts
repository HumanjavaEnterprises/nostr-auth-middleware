import { 
  generateKeyPairWithSeed,
  validateSeedPhrase 
} from '@humanjavaenterprises/nostr-nsec-seedphrase-library';
import { createLogger } from '../utils/logger';
import { NostrEventValidator } from '../validators/nostr-event.validator';
import { NostrEvent } from '../utils/types';
import { 
  NostrAuthConfig, 
  NostrProfile, 
  NostrChallenge,
  NostrEnrollment,
  VerificationResult 
} from '../types';
import jwt from 'jsonwebtoken';
import { generateChallenge, verifySignature } from '../utils/crypto.utils';
import { hexToBytes } from '@noble/hashes/utils';

export class NostrService {
  private readonly logger = createLogger('NostrService');
  private readonly validator: NostrEventValidator;
  private readonly challenges: Map<string, NostrChallenge> = new Map();
  private readonly profiles: Map<string, NostrProfile> = new Map();
  private readonly CHALLENGE_EXPIRY = 5 * 60 * 1000; // 5 minutes
  private serverPubkey: string = '';
  private privateKey: string = '';
  private seedPhrase?: string;

  constructor(private readonly config: NostrAuthConfig) {
    this.validator = new NostrEventValidator();
    this.config.eventTimeoutMs = this.config.eventTimeoutMs || 5000;
    this.config.challengePrefix = this.config.challengePrefix || 'nostr:auth:';

    // Generate a development private key if not provided
    if ((this.config.keyManagementMode === 'development' || this.config.testMode) && !this.config.privateKey) {
      const keyPair = generateKeyPairWithSeed();
      this.seedPhrase = keyPair.seedPhrase;
      this.privateKey = keyPair.privateKey;
      this.logger.info('Generated development/test private key from seed phrase');
    } else {
      this.privateKey = this.config.privateKey || '';
    }

    // Initialize server's public key
    try {
      this.serverPubkey = this.config.publicKey || '';
      if (!this.serverPubkey) {
        throw new Error('Server public key not configured');
      }
    } catch (error) {
      this.logger.error('Failed to initialize server public key:', error);
      throw error;
    }
  }

  private getPrivateKeyBytes(): Uint8Array {
    if (!this.privateKey) {
      this.logger.error('Private key not found in config');
      throw new Error('Server private key not configured');
    }

    try {
      // Remove '0x' prefix if present
      const cleanKey = this.privateKey.replace('0x', '');
      this.logger.debug('Clean private key length:', cleanKey.length);
      
      // Ensure the key is 64 characters (32 bytes) long
      if (cleanKey.length !== 64) {
        this.logger.error('Invalid private key length:', cleanKey.length);
        throw new Error('Private key must be 32 bytes (64 hex characters)');
      }
      
      const keyBytes = hexToBytes(cleanKey);
      this.logger.debug('Private key bytes length:', keyBytes.length);
      return keyBytes;
    } catch (error) {
      this.logger.error('Failed to process private key:', error);
      throw new Error('Invalid private key format');
    }
  }

  private cleanupExpiredChallenges() {
    const now = Date.now();
    for (const [id, challenge] of this.challenges.entries()) {
      if (challenge.expiresAt < now) {
        this.challenges.delete(id);
      }
    }
  }

  /**
   * Create a challenge event for authentication
   */
  async createChallenge(pubkey: string): Promise<NostrChallenge> {
    try {
      // Make sure server keys are initialized
      if (!this.privateKey) {
        this.logger.error('Private key not configured');
        throw new Error('Server private key not configured');
      }

      this.cleanupExpiredChallenges();

      this.logger.info('Creating challenge for pubkey:', pubkey);
      this.logger.debug('Using private key:', this.privateKey.substring(0, 8) + '...');
      
      try {
        const challengeEvent = await generateChallenge(this.privateKey, pubkey);
        this.logger.debug('Generated challenge event:', JSON.stringify(challengeEvent, null, 2));
        const expiresAt = Date.now() + this.CHALLENGE_EXPIRY;

        const challenge: NostrChallenge = {
          id: challengeEvent.id,
          event: challengeEvent,
          expiresAt
        };

        this.challenges.set(challenge.id, challenge);
        return challenge;
      } catch (error) {
        this.logger.error('Failed to generate challenge event:', error);
        throw error;
      }
    } catch (error) {
      this.logger.error('Failed to create challenge:', error);
      throw error;
    }
  }

  /**
   * Verify a signed challenge response
   */
  async verifyChallenge(challengeId: string, signedEvent: NostrEvent): Promise<VerificationResult> {
    try {
      const challenge = this.challenges.get(challengeId);
      if (!challenge) {
        return { success: false, message: 'Challenge not found or expired' };
      }

      // Verify the signed event
      const isValid = await this.validator.validateEvent(signedEvent);
      if (!isValid) {
        return { success: false, message: 'Invalid signature' };
      }

      // Verify challenge matches
      const expectedContent = `nostr:auth:${challengeId}`;
      if (signedEvent.content !== expectedContent) {
        return { success: false, message: 'Challenge mismatch' };
      }

      // Generate JWT token
      const token = this.generateToken(signedEvent.pubkey);

      // Get or create profile
      const profile = await this.getOrCreateProfile(signedEvent.pubkey);

      return {
        success: true,
        token,
        profile
      };
    } catch (error) {
      this.logger.error('Failed to verify challenge:', error);
      return { success: false, message: 'Verification failed' };
    }
  }

  private async getOrCreateProfile(pubkey: string): Promise<NostrProfile> {
    // Check in-memory cache first
    let profile = this.profiles.get(pubkey);
    if (profile) {
      return profile;
    }

    // Create basic profile
    profile = {
      pubkey,
      name: `nostr:${pubkey.substring(0, 8)}`,
    };

    // Store in memory
    this.profiles.set(pubkey, profile);
    return profile;
  }

  /**
   * Start enrollment process for a new user
   */
  async startEnrollment(pubkey: string): Promise<NostrEnrollment> {
    try {
      if (!this.privateKey) {
        throw new Error('Server private key not configured');
      }

      const created_at = Math.floor(Date.now() / 1000);
      const expiresAt = created_at + 300; // 5 minutes

      const event: NostrEvent = {
        kind: 22243, // Enrollment event kind
        created_at,
        tags: [
          ['p', pubkey],
          ['expires_at', expiresAt.toString()]
        ],
        content: 'Enrollment request',
        pubkey: this.serverPubkey,
        id: '',
        sig: ''
      };

      const enrollment = this.createEnrollment(event);
      this.profiles.set(pubkey, enrollment);
      return enrollment;
    } catch (error) {
      this.logger.error('Failed to start enrollment:', error);
      throw error;
    }
  }

  /**
   * Verify enrollment response
   */
  async verifyEnrollment(signedEvent: NostrEvent): Promise<VerificationResult> {
    try {
      const enrollment = this.profiles.get(signedEvent.pubkey);
      if (!enrollment) {
        return {
          success: false,
          message: 'No enrollment found'
        };
      }

      // Validate event format and signature
      if (!await this.validator.validateEnrollmentEvent(signedEvent)) {
        return {
          success: false,
          message: 'Invalid event format or signature'
        };
      }

      // Store enrollment if verification successful
      await this.storeEnrollment(signedEvent.pubkey);

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
    const profile = this.profiles.get(pubkey);
    if (profile) {
      return profile;
    }

    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('pubkey', pubkey)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        this.profiles.set(pubkey, data);
        return data;
      }
    }

    return { pubkey };
  }

  /**
   * Store enrollment in storage
   */
  async storeEnrollment(pubkey: string): Promise<boolean> {
    if (this.supabase) {
      const { error } = await this.supabase
        .from('enrollments')
        .insert([{ pubkey }]);

      if (error) {
        throw error;
      }
    }

    return true;
  }

  /**
   * Create enrollment object
   */
  createEnrollment(signedEvent: NostrEvent): NostrEnrollment {
    return {
      pubkey: signedEvent.pubkey,
      event: signedEvent,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      enrolled_at: new Date().toISOString()
    };
  }

  /**
   * Generate a JWT token for the authenticated user
   */
  generateToken(pubkey: string): string {
    if (!this.config.jwtSecret) {
      throw new Error('JWT secret is required');
    }

    return jwt.sign({ pubkey }, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiresIn || '1h'
    });
  }

  public validateSeedPhrase(seedPhrase: string): boolean {
    return validateSeedPhrase(seedPhrase);
  }
}
