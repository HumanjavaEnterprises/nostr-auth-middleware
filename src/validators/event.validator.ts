import { Event } from 'nostr-tools';
import { createLogger } from '../utils/logger';
import { generateEventHash, verifySignature } from '../utils/crypto.utils';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

export class NostrEventValidator {
  private readonly logger = createLogger('NostrEventValidator');

  /**
   * Validate a Nostr event
   */
  async validateEvent(event: Event): Promise<boolean> {
    try {
      // Check required fields
      if (!event.id || !event.pubkey || !event.sig || !event.kind || !event.created_at) {
        this.logger.warn('Missing required fields in event');
        return false;
      }

      // Validate pubkey format (hex string of length 64)
      if (!/^[0-9a-f]{64}$/.test(event.pubkey)) {
        this.logger.warn('Invalid pubkey format');
        return false;
      }

      // Validate signature format (hex string of length 128)
      if (!/^[0-9a-f]{128}$/.test(event.sig)) {
        this.logger.warn('Invalid signature format');
        return false;
      }

      // Validate event ID format (hex string of length 64)
      if (!/^[0-9a-f]{64}$/.test(event.id)) {
        this.logger.warn('Invalid event ID format');
        return false;
      }

      // Validate created_at timestamp
      const now = Math.floor(Date.now() / 1000);
      if (event.created_at > now + 300 || event.created_at < now - 300) {
        this.logger.warn('Event timestamp is too far from current time');
        return false;
      }

      // Validate tags format
      if (!Array.isArray(event.tags)) {
        this.logger.warn('Invalid tags format');
        return false;
      }

      for (const tag of event.tags) {
        if (!Array.isArray(tag) || tag.length < 2) {
          this.logger.warn('Invalid tag format');
          return false;
        }
      }

      // Verify event hash
      const calculatedHash = generateEventHash(event);
      if (calculatedHash !== event.id) {
        this.logger.warn('Event hash verification failed');
        return false;
      }

      // Verify signature
      const eventHash = sha256(Uint8Array.from(Buffer.from(event.id, 'hex')));
      const isValid = await verifySignature(event.sig, eventHash, event.pubkey);
      if (!isValid) {
        this.logger.warn('Event signature verification failed');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Event validation failed:', error);
      return false;
    }
  }

  /**
   * Validate a challenge event
   */
  async validateChallengeEvent(event: Event): Promise<boolean> {
    try {
      if (!await this.validateEvent(event)) {
        return false;
      }

      // Challenge events must be kind 22242
      if (event.kind !== 22242) {
        this.logger.warn('Invalid event kind for challenge');
        return false;
      }

      // Must have a challenge tag
      const challengeTag = event.tags.find(t => t[0] === 'challenge');
      if (!challengeTag) {
        this.logger.warn('Missing challenge tag');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Challenge event validation failed:', error);
      return false;
    }
  }

  /**
   * Validate an enrollment event
   */
  async validateEnrollmentEvent(event: Event): Promise<boolean> {
    try {
      if (!await this.validateEvent(event)) {
        return false;
      }

      // Enrollment events must be kind 22243
      if (event.kind !== 22243) {
        this.logger.warn('Invalid event kind for enrollment');
        return false;
      }

      // Must have an action tag with value 'enroll'
      const actionTag = event.tags.find(t => t[0] === 'action' && t[1] === 'enroll');
      if (!actionTag) {
        this.logger.warn('Missing or invalid action tag');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Enrollment event validation failed:', error);
      return false;
    }
  }
}
