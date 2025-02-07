/**
 * Browser-specific Nostr authentication implementation
 * Provides a lightweight client-side authentication flow using NIP-07
 */

import { NostrEvent } from '../types';
import '../types/nip07';  // Import NIP-07 type definitions

export interface NostrBrowserConfig {
  customKind?: number;
  clientName?: string;
}

export class NostrBrowserAuth {
  private readonly eventKind: number;
  private readonly clientName: string;

  constructor(config?: NostrBrowserConfig) {
    this.eventKind = config?.customKind || 22242; // Custom kind for authentication
    this.clientName = config?.clientName || 'nostr-auth';
  }

  /**
   * Creates a challenge for authentication
   * @returns {Promise<{challenge: string, timestamp: number}>}
   */
  async createChallenge(): Promise<{ challenge: string; timestamp: number }> {
    const challenge = `${this.clientName}-${Math.random().toString(36).substring(2, 15)}`;
    const timestamp = Math.floor(Date.now() / 1000);
    return { challenge, timestamp };
  }

  /**
   * Authenticates using NIP-07 window.nostr
   * This will trigger permission requests in the user's Nostr extension
   * @returns {Promise<{pubkey: string, timestamp: number, challenge: string, signedEvent: NostrEvent}>}
   * @throws {Error} When Nostr extension is not found or authentication fails
   */
  async authenticate(): Promise<{
    pubkey: string;
    timestamp: number;
    challenge: string;
    signedEvent: NostrEvent;
  }> {
    if (!window.nostr) {
      throw new Error('Nostr extension not found. Please install a Nostr extension like nos2x or Alby.');
    }

    try {
      // Step 1: Get public key and request read permission
      const pubkey = await window.nostr.getPublicKey();
      
      // Step 2: Create a challenge
      const { challenge, timestamp } = await this.createChallenge();
      
      // Step 3: Request signature permission by asking user to sign the challenge
      const event = {
        kind: this.eventKind,
        created_at: timestamp,
        content: challenge,
        tags: [
          ['p', pubkey],
          ['client', this.clientName],
          ['challenge', challenge]
        ]
      } as NostrEvent;

      // This will trigger the extension's permission popup
      const signedEvent = await window.nostr.signEvent(event);
      
      return {
        pubkey,
        timestamp: Date.now(),
        challenge,
        signedEvent
      };
    } catch (error) {
      console.error('Nostr authentication failed:', error);
      throw error;
    }
  }

  /**
   * Validates a session by checking if the current public key matches
   * @param {object} session - Session object containing pubkey
   * @returns {Promise<boolean>}
   */
  async validateSession(session: { pubkey: string }): Promise<boolean> {
    if (!window.nostr || !session?.pubkey) {
      return false;
    }
    
    try {
      const currentPubkey = await window.nostr.getPublicKey();
      return currentPubkey === session.pubkey;
    } catch {
      return false;
    }
  }
}
