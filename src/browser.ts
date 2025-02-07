/**
 * Browser-specific entry point for Nostr Auth Middleware
 * This file is used to create the browser bundle
 */

export * from './index.js';
export { NostrBrowserAuth, type NostrBrowserConfig } from './browser/nostr-browser-auth.js';

// Add any browser-specific exports or modifications here
