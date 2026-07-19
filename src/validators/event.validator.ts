/**
 * @fileoverview Validator for Nostr events
 * Provides functions for validating different types of Nostr events including challenges and enrollments
 * @module event-validator
 * @security This module is critical for maintaining the security of the Nostr authentication system
 */

import { NostrEvent } from '../types.js';
import { verifySignature } from 'nostr-crypto-utils';
import { createLogger } from '../utils/logger.js';
import { generateEventHash } from '../utils/crypto.utils.js';
import { VerificationResult } from '../types.js';

const logger = createLogger('NostrEventValidator');

/** Default Nostr event kind for authentication challenge events (NIP-42 style). */
export const DEFAULT_CHALLENGE_KIND = 22242;

/**
 * Extracts the challenge nonce carried in an event's ['challenge', <nonce>] tag.
 * This is the single, canonical representation of the challenge value used across
 * the auth flow (bundled browser/NIP-46 clients set this tag; the server binds the
 * signed event to the issued challenge by comparing this value).
 * @param {NostrEvent} event - The signed challenge event
 * @returns {string | undefined} The challenge value, or undefined if absent
 */
export function getChallengeTagValue(event: NostrEvent): string | undefined {
  if (!Array.isArray(event.tags)) return undefined;
  const tag = event.tags.find(t => Array.isArray(t) && t[0] === 'challenge');
  return tag?.[1];
}

/**
 * Validates a generic Nostr event
 * @param {NostrEvent} event - The event to validate
 * @returns {Promise<VerificationResult>} Result of the validation
 * @description
 * Performs the following checks:
 * 1. Verifies all required fields are present
 * 2. Validates pubkey format (64 hex characters)
 * 3. Validates signature format (128 hex characters)
 * 4. Verifies the cryptographic signature
 * @security Critical for preventing unauthorized access and ensuring event integrity
 */
export async function validateEvent(event: NostrEvent): Promise<VerificationResult> {
  try {
    // Check required fields.
    // NOTE: content must be a *string*, but empty string is spec-legal (NIP-01):
    // kind 3/7/22242 auth events routinely carry content:''. Using truthiness
    // here previously rejected validly-signed empty-content events.
    if (!event.pubkey || typeof event.content !== 'string' || !event.sig) {
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

    // Validate timestamp to prevent replay attacks
    const now = Math.floor(Date.now() / 1000);
    if (!event.created_at || typeof event.created_at !== 'number') {
      return { success: false, error: 'Missing or invalid created_at timestamp' };
    }
    if (event.created_at < now - 300) {
      return { success: false, error: 'Event timestamp too old' };
    }
    if (event.created_at > now + 60) {
      return { success: false, error: 'Event timestamp too far in the future' };
    }

    return { success: true, pubkey: event.pubkey };
  } catch (error) {
    logger.error('Event validation error:', { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: 'Event validation failed' };
  }
}

/**
 * Validates a challenge event used in authentication
 * @param {NostrEvent} event - The challenge event to validate
 * @returns {Promise<boolean>} True if the challenge event is valid
 * @description
 * Performs the following checks:
 * 1. Basic event validation
 * 2. Verifies event kind is 22242 (challenge event)
 * 3. Checks for presence of challenge tag
 * 4. Validates event hash
 * 5. Verifies cryptographic signature
 * @security Critical for preventing replay attacks and ensuring challenge integrity
 */
export async function validateChallengeEvent(
  event: NostrEvent,
  expectedKind: number = DEFAULT_CHALLENGE_KIND
): Promise<boolean> {
  try {
    const result = await validateEvent(event);
    if (!result.success) {
      return false;
    }

    // Challenge events must be the configured challenge kind (default 22242)
    if (event.kind !== expectedKind) {
      logger.warn('Invalid event kind for challenge');
      return false;
    }

    // Must have a challenge tag carrying a non-empty nonce
    const challengeValue = getChallengeTagValue(event);
    if (!challengeValue) {
      logger.warn('Missing challenge tag');
      return false;
    }

    // Basic validation
    if (!validateBasicEventFormat(event)) {
      return false;
    }

    // Validate event hash (id integrity). generateEventHash is async.
    const hash = await generateEventHash(event);
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
 * Validates an enrollment event
 * @param {NostrEvent} event - The enrollment event to validate
 * @returns {Promise<boolean>} True if the enrollment event is valid
 * @description
 * Performs the following checks:
 * 1. Basic event validation
 * 2. Verifies enrollment-specific fields and format
 * 3. Validates cryptographic signatures
 * @security Critical for preventing unauthorized enrollments
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

    // Validate event hash (id integrity). generateEventHash is async.
    const hash = await generateEventHash(event);
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

/**
 * Validates the basic format of a Nostr event
 * @param {NostrEvent} event - The event to validate
 * @returns {boolean} True if the event format is valid
 * @private
 */
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
