/**
 * @fileoverview Cryptographic utilities for Nostr protocol implementation
 * Provides functions for key generation, event signing, and challenge-response authentication
 * @module crypto-utils
 */

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
 * Generates a hash for a Nostr event
 * @param {Partial<NostrEvent>} event - The event to hash
 * @returns {string} The event hash in hex format
 */
export function generateEventHash(event: Partial<NostrEvent>): string {
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
 * Generates a challenge event for authentication
 * @param {string} privateKey - The server's private key to sign the challenge with
 * @param {string} challengePubkey - The public key to generate the challenge for
 * @returns {Promise<NostrEvent>} The generated and signed challenge event
 */
export async function generateChallenge(privateKey: string, challengePubkey?: string): Promise<NostrEvent> {
  const pubkey = challengePubkey ?? getPublicKeySync(privateKey);
  const signed = await finalizeEvent({
    kind: 22242,
    tags: [['challenge', pubkey]],
    content: 'Authentication request'
  }, privateKey);

  return signed as unknown as NostrEvent;
}
