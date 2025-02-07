/**
 * Browser-specific entry point for Nostr Auth Middleware
 * This file is used to create the browser bundle
 */

export * from './index.js';

/**
 * Browser-specific exports
 */

import { NostrEvent } from './types.js';
import { NostrBrowserAuth, type NostrBrowserConfig } from './browser/nostr-browser-auth.js';

export { NostrEvent, NostrBrowserAuth, NostrBrowserConfig };
