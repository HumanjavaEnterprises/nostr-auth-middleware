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
import { hexToBytes } from '@noble/hashes/utils';
import { VerificationResult } from '../types.js';

const logger = createLogger('NostrEventValidator');

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
