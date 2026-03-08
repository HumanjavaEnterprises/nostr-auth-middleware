/**
 * Browser-specific entry point for Nostr Auth Middleware
 * This file is used to create the browser bundle
 */

export * from './index.js';

/**
 * Browser-specific exports
 */

import type { NostrEvent, Nip46AuthConfig, Nip46AuthResult } from './types.js';
import { NostrBrowserAuth, type NostrBrowserConfig } from './browser/nostr-browser-auth.js';
import { Nip46AuthHandler, type Nip46Transport } from './browser/nip46-auth-handler.js';

export { NostrEvent, NostrBrowserAuth, NostrBrowserConfig };
export { Nip46AuthHandler, Nip46Transport, Nip46AuthConfig, Nip46AuthResult };
