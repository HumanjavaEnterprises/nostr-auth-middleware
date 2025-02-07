/**
 * @fileoverview Cryptographic utilities for Nostr protocol implementation
 * Provides functions for key generation, event signing, and challenge-response authentication
 * @module crypto-utils
 */

import { 
  generateKeyPair as genKeyPair,
  getPublicKey as getNostrPublicKey,
  calculateEventId as getEventHash,
  signEvent as signNostrEvent,
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
 * Derives a public key from a private key
 * @param {string} privateKey - The private key in hex format
 * @returns {Promise<string>} The derived public key in hex format
 */
export async function getPublicKey(privateKey: string): Promise<string> {
  const publicKeyDetails = await getNostrPublicKey(privateKey);
  return publicKeyDetails.toString();
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
 * Signs a Nostr event with a private key
 * @param {NostrEvent} event - The event to sign
 * @param {string} privateKey - The private key to sign with
 * @returns {Promise<NostrEvent>} The signed event
 */
export async function signEvent(event: NostrEvent, privateKey: string): Promise<NostrEvent> {
  return signNostrEvent(event, privateKey);
}

/**
 * Generates a challenge event for authentication
 * @param {string} pubkey - The public key to generate the challenge for
 * @returns {Promise<NostrEvent>} The generated challenge event
 */
export async function generateChallenge(pubkey: string): Promise<NostrEvent> {
  const now = Math.floor(Date.now() / 1000);
  const event: NostrEvent = {
    kind: 22242,
    created_at: now,
    tags: [['challenge', pubkey]],
    content: 'Authentication request',
    pubkey: pubkey,
    id: '',
    sig: ''
  };

  event.id = getEventHash(event);
  event.sig = await signNostrEvent(event, pubkey);

  return event;
}
