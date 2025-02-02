import { NostrEvent } from '../types.js';
import { verifySignature } from 'nostr-crypto-utils';
import { createLogger } from '../utils/logger.js';
import { generateEventHash } from '../utils/crypto.utils.js';
import { hexToBytes } from '@noble/hashes/utils';
import { VerificationResult } from '../types.js';

const logger = createLogger('NostrEventValidator');

/**
 * Validate a Nostr event
 */
export async function validateEvent(event: NostrEvent): Promise<VerificationResult> {
  try {
    // Check required fields
    if (!event.pubkey || !event.content || !event.sig) {
      return { success: false, error: 'Missing required fields' };
    }

    // Validate pubkey format
    if (!/^[0-9a-f]{64}$/.test(event.pubkey)) {
      return { success: false, error: 'Invalid pubkey format' };
    }

    // Validate signature format
    if (!/^[0-9a-f]{128}$/.test(event.sig)) {
      return { success: false, error: 'Invalid signature format' };
    }

    // Verify signature
    const isValid = await verifySignature(event);
    if (!isValid) {
      return { success: false, error: 'Invalid signature' };
    }

    return { success: true, pubkey: event.pubkey };
  } catch (error) {
    logger.error('Event validation error:', { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: 'Event validation failed' };
  }
}

/**
 * Validate a challenge event
 */
export async function validateChallengeEvent(event: NostrEvent): Promise<boolean> {
  try {
    const result = await validateEvent(event);
    if (!result.success) {
      return false;
    }

    // Challenge events must be kind 22242
    if (event.kind !== 22242) {
      logger.warn('Invalid event kind for challenge');
      return false;
    }

    // Must have a challenge tag
    const challengeTag = event.tags.find(t => t[0] === 'challenge');
    if (!challengeTag) {
      logger.warn('Missing challenge tag');
      return false;
    }

    // Basic validation
    if (!validateBasicEventFormat(event)) {
      return false;
    }

    // Validate event hash
    const hash = generateEventHash(event);
    if (hash !== event.id) {
      logger.error('Event hash mismatch');
      return false;
    }

    // Verify signature
    const signatureValid = await verifySignature(event);

    if (!signatureValid) {
      logger.error('Invalid signature');
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Challenge event validation failed:', error);
    return false;
  }
}

/**
 * Validate an enrollment event
 */
export async function validateEnrollmentEvent(event: NostrEvent): Promise<boolean> {
  try {
    const result = await validateEvent(event);
    if (!result.success) {
      return false;
    }

    // Enrollment events must be kind 22243
    if (event.kind !== 22243) {
      logger.warn('Invalid event kind for enrollment');
      return false;
    }

    // Must have an action tag with value 'enroll'
    const actionTag = event.tags.find(t => t[0] === 'action' && t[1] === 'enroll');
    if (!actionTag) {
      logger.warn('Missing or invalid action tag');
      return false;
    }

    // Basic validation
    if (!validateBasicEventFormat(event)) {
      return false;
    }

    // Validate event hash
    const hash = generateEventHash(event);
    if (hash !== event.id) {
      logger.error('Event hash mismatch');
      return false;
    }

    // Verify signature
    const signatureValid = await verifySignature(event);

    if (!signatureValid) {
      logger.error('Invalid signature');
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Enrollment event validation failed:', error);
    return false;
  }
}

function validateBasicEventFormat(event: NostrEvent): boolean {
  // Check required fields
  if (!event.kind || !event.created_at || !event.pubkey || !event.id || !event.sig) {
    logger.error('Missing required fields');
    return false;
  }

  // Check types
  if (typeof event.kind !== 'number' ||
    typeof event.created_at !== 'number' ||
    typeof event.pubkey !== 'string' ||
    typeof event.id !== 'string' ||
    typeof event.sig !== 'string' ||
    !Array.isArray(event.tags)) {
    logger.error('Invalid field types');
    return false;
  }

  return true;
}
