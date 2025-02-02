/**
 * @fileoverview Core Nostr protocol interfaces
 * Defines the fundamental data structures used in the Nostr protocol
 * @module nostr-interfaces
 */

/**
 * Interface representing a Nostr event
 * @interface NostrEvent
 * @description
 * Represents a signed event in the Nostr protocol as defined in NIP-01.
 * All fields are required and must follow specific format requirements.
 * @see https://github.com/nostr-protocol/nips/blob/master/01.md
 */
export interface NostrEvent {
  /** Event ID (32-bytes hex string) */
  id: string;
  /** Public key of the event creator (32-bytes hex string) */
  pubkey: string;
  /** Unix timestamp in seconds */
  created_at: number;
  /** Event kind number (as defined in NIPs) */
  kind: number;
  /** Array of tags, each tag is an array of strings */
  tags: string[][];
  /** Event content (arbitrary string) */
  content: string;
  /** Cryptographic signature of the event (64-bytes hex string) */
  sig: string;
}

/**
 * Interface representing a Nostr event filter
 * @interface NostrFilter
 * @description
 * Used to filter events when querying relays.
 * All fields are optional, and additional fields may be added
 * as specified in various NIPs.
 * @see https://github.com/nostr-protocol/nips/blob/master/01.md#communication-between-clients-and-relays
 */
export interface NostrFilter {
  /** List of event IDs to match */
  ids?: string[];
  /** List of pubkeys to match (event creators) */
  authors?: string[];
  /** List of event kinds to match */
  kinds?: number[];
  /** Events not older than this timestamp */
  since?: number;
  /** Events not newer than this timestamp */
  until?: number;
  /** Maximum number of events to return */
  limit?: number;
  /** Additional filter fields as defined in NIPs */
  [key: string]: any;
}

/**
 * Interface representing a Nostr subscription
 * @interface NostrSubscription
 * @description
 * Used to subscribe to events from relays.
 * A subscription can have multiple filters to match events.
 */
export interface NostrSubscription {
  /** Unique subscription identifier */
  id: string;
  /** Array of filters to match events */
  filters: NostrFilter[];
}

/**
 * Interface representing a Nostr relay message
 * @interface NostrMessage
 * @description
 * Represents messages exchanged between clients and relays.
 * The structure varies based on the message type.
 * @example
 * // Event message
 * const eventMsg: NostrMessage = {
 *   type: 'EVENT',
 *   event: { ... }
 * };
 * 
 * // Challenge message
 * const challengeMsg: NostrMessage = {
 *   type: 'CHALLENGE',
 *   challenge: 'some-challenge-string'
 * };
 */
export interface NostrMessage {
  /** Message type (e.g., 'EVENT', 'REQ', 'CLOSE') */
  type: string;
  /** Optional event data */
  event?: NostrEvent;
  /** Optional subscription data */
  subscription?: NostrSubscription;
  /** Optional challenge string */
  challenge?: string;
  /** Optional message content */
  message?: string;
}
