/**
 * @fileoverview Cryptographic utilities for Nostr protocol implementation
 * Provides functions for key generation, event signing, and challenge-response authentication
 * @module crypto-utils
 */

import crypto from 'crypto';
import {
  generateKeyPair as genKeyPair,
  getPublicKeySync,
  calculateEventId as getEventHash,
  finalizeEvent,
  verifySignature as verifyNostrSignature
} from 'nostr-crypto-utils';
import { NostrEvent } from '../types.js';

/**
 * Generates a new Nostr key pair
 * @returns {Promise<{privateKey: string, publicKey: string}>} Generated key pair
 */
export function generateKeyPair() {
  return genKeyPair();
}

/**
 * Derives a public key from a private key (synchronous)
 * @param {string} privateKey - The private key in hex format
 * @returns {string} The derived public key in hex format
 */
export function getPublicKey(privateKey: string): string {
  return getPublicKeySync(privateKey);
}

/**
 * Verifies the signature of a Nostr event
 * @param {NostrEvent} event - The event to verify
 * @returns {Promise<boolean>} True if signature is valid, false otherwise
 */
export async function verifySignature(event: NostrEvent): Promise<boolean> {
  return verifyNostrSignature(event);
}

/**
 * Generates a hash (event id) for a Nostr event
 * @param {Partial<NostrEvent>} event - The event to hash
 * @returns {Promise<string>} The event hash in hex format
 * @description The underlying calculateEventId is asynchronous, so this helper
 * MUST be awaited. Prior to v0.6.0 it was typed as returning a bare string,
 * which silently returned a Promise and made every event-id integrity check
 * (validateChallengeEvent / validateEnrollmentEvent) compare a Promise against
 * a string — i.e. always mismatch. Callers must now `await` the result.
 */
export async function generateEventHash(event: Partial<NostrEvent>): Promise<string> {
  return getEventHash(event as NostrEvent);
}

/**
 * Signs a Nostr event with a private key using finalizeEvent
 * @param {NostrEvent} event - The event to sign
 * @param {string} privateKey - The private key to sign with
 * @returns {Promise<NostrEvent>} The signed event with id, pubkey, and sig
 */
export async function signEvent(event: NostrEvent, privateKey: string): Promise<NostrEvent> {
  const signed = await finalizeEvent(event, privateKey);
  return signed as unknown as NostrEvent;
}

/**
 * Generates a challenge event for authentication.
 *
 * @param {string} privateKey - The server's private key to sign the challenge with
 * @param {string} [challengePubkey] - The target user's public key, bound via a 'p' tag
 * @returns {Promise<{ event: NostrEvent; challenge: string }>} The signed challenge
 *          event plus the random nonce. The caller MUST persist `challenge` and
 *          verify single-use: a signed response is only valid if its ['challenge', ...]
 *          tag equals this exact nonce.
 *
 * @security BREAKING (v0.6.0). Prior versions used the (public, constant) pubkey as
 * the challenge value with fixed content, providing zero freshness — any signature
 * over that predictable event replayed forever. The challenge is now a
 * cryptographically-random 32-byte nonce carried in the ['challenge', nonce] tag,
 * with the target pubkey bound separately via a ['p', pubkey] tag. For stateful
 * flows prefer NostrService.createChallenge(), which stores the nonce and enforces
 * expiry + single-use automatically.
 */
export async function generateChallenge(
  privateKey: string,
  challengePubkey?: string
): Promise<{ event: NostrEvent; challenge: string }> {
  const pubkey = challengePubkey ?? getPublicKeySync(privateKey);
  const challenge = crypto.randomBytes(32).toString('hex');
  const signed = await finalizeEvent({
    kind: 22242,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['challenge', challenge],
      ['p', pubkey]
    ],
    content: `Authentication request: ${challenge}`
  }, privateKey);

  return { event: signed as unknown as NostrEvent, challenge };
}
