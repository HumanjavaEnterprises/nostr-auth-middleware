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
import { hexToBytes } from '@noble/hashes/utils';
import crypto from 'crypto';
import { NostrEvent } from '../types.js';

/**
 * Creates a serialized event string for hashing
 * @param {Partial<NostrEvent>} event - The event to serialize
 * @returns {string} JSON string of the serialized event
 * @private
 */
function serializeEvent(event: Partial<NostrEvent>) {
    return JSON.stringify([
        0,
        event.pubkey,
        event.created_at,
        event.kind,
        event.tags,
        event.content
    ]);
}

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

/**
 * Signs a challenge response event
 * @param {string} challenge - The challenge string to respond to
 * @param {string} privateKey - The private key to sign with
 * @returns {Promise<NostrEvent>} The signed challenge response event
 */
export async function signChallenge(challenge: string, privateKey: string): Promise<NostrEvent> {
  const now = Math.floor(Date.now() / 1000);
  const event: NostrEvent = {
    kind: 22242,
    created_at: now,
    tags: [['challenge', challenge]],
    content: 'Authentication response',
    pubkey: await getPublicKey(privateKey),
    id: '',
    sig: ''
  };

  event.id = getEventHash(event);
  const signedEvent = await signNostrEvent(event, privateKey);
  return signedEvent;
}

/**
 * Generates a server-side challenge event for client authentication
 * @param {string} serverPrivateKey - The server's private key
 * @param {string} clientPubkey - The client's public key
 * @returns {Promise<NostrEvent>} The generated server challenge event
 */
export async function generateChallengeServer(serverPrivateKey: string, clientPubkey: string): Promise<NostrEvent> {
  const timestamp = Math.floor(Date.now() / 1000);
  const randomValue = crypto.randomBytes(32).toString('hex');
  const pubkey = await getPublicKey(serverPrivateKey);
  
  const event: NostrEvent = {
    kind: 22242,
    created_at: timestamp,
    tags: [
      ['p', clientPubkey],
      ['relay', 'wss://relay.damus.io'],
      ['challenge', randomValue]
    ],
    content: '',
    pubkey,
    id: '',
    sig: ''
  };

  // Generate event hash and sign using our crypto utils
  event.id = generateEventHash(event);
  const signedEvent = await signNostrEvent(event, serverPrivateKey);

  return signedEvent;
}
