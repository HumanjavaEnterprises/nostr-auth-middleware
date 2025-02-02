/**
 * @fileoverview Nostr profile model definition
 * Defines the structure for user profiles in the Nostr protocol
 * @module nostr-profile
 */

/**
 * Interface representing a Nostr user profile
 * @interface NostrProfile
 * @description
 * Follows NIP-01 and NIP-05 specifications for user profiles.
 * All fields except pubkey, created_at, and updated_at are optional
 * as per the Nostr protocol specification.
 */
export interface NostrProfile {
  /** Public key of the profile owner in hex format */
  pubkey: string;
  /** Display name of the user */
  name?: string;
  /** User's bio or description */
  about?: string;
  /** URL to the user's profile picture */
  picture?: string;
  /** NIP-05 identifier for verification (format: name@domain.com) */
  nip05?: string;
  /** Unix timestamp when the profile was created */
  created_at: number;
  /** Unix timestamp when the profile was last updated */
  updated_at: number;
}
