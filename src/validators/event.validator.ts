import { NostrEvent } from '../utils/types.js';
import { createLogger } from '../utils/logger.js';
import { generateEventHash, verifySignature } from '../utils/crypto.utils.js';
import { hexToBytes } from '@noble/hashes/utils';

export class NostrEventValidator {
  private readonly logger = createLogger('NostrEventValidator');

  /**
   * Validate a Nostr event
   */
  async validateEvent(event: NostrEvent): Promise<boolean> {
    try {
      // Check required fields
      if (!event.id || !event.pubkey || !event.sig || !event.kind || !event.created_at) {
        this.logger.warn('Missing required fields in event');
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

      return true;
    } catch (error) {
      this.logger.error('Event validation failed:', error);
      return false;
    }
  }

  /**
   * Validate a challenge event
   */
  async validateChallengeEvent(event: NostrEvent): Promise<boolean> {
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

      // Basic validation
      if (!this.validateBasicEventFormat(event)) {
        return false;
      }

      // Validate event hash
      const hash = generateEventHash(event);
      if (hash !== event.id) {
        this.logger.error('Event hash mismatch');
        return false;
      }

      // Verify signature
      const signatureValid = await verifySignature(
        event.sig,
        hexToBytes(event.id),
        event.pubkey
      );

      if (!signatureValid) {
        this.logger.error('Invalid signature');
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
  async validateEnrollmentEvent(event: NostrEvent): Promise<boolean> {
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

      // Basic validation
      if (!this.validateBasicEventFormat(event)) {
        return false;
      }

      // Validate event hash
      const hash = generateEventHash(event);
      if (hash !== event.id) {
        this.logger.error('Event hash mismatch');
        return false;
      }

      // Verify signature
      const signatureValid = await verifySignature(
        event.sig,
        hexToBytes(event.id),
        event.pubkey
      );

      if (!signatureValid) {
        this.logger.error('Invalid signature');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Enrollment event validation failed:', error);
      return false;
    }
  }

  private validateBasicEventFormat(event: NostrEvent): boolean {
    // Check required fields
    if (!event.kind || !event.created_at || !event.pubkey || !event.id || !event.sig) {
      this.logger.error('Missing required fields');
      return false;
    }

    // Check types
    if (typeof event.kind !== 'number' ||
      typeof event.created_at !== 'number' ||
      typeof event.pubkey !== 'string' ||
      typeof event.id !== 'string' ||
      typeof event.sig !== 'string' ||
      !Array.isArray(event.tags)) {
      this.logger.error('Invalid field types');
      return false;
    }

    return true;
  }
}
