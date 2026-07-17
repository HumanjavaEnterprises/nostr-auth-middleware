# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2026-07-17

### Security
- **CRITICAL — account-takeover / auth-bypass fixed.** `NostrService.verifyChallenge`
  never bound the signed event to the issued challenge. The Supabase branch only ran a
  generic signature/timestamp check and then looked up *any* pending challenge for the
  pubkey — it never compared the signed challenge, never checked the event kind, and
  never checked the challenge tag. An attacker could request a challenge for a victim's
  pubkey, grab **any** recently-signed public event from that victim off a relay (e.g. a
  kind-1 note within the freshness window), POST it to `/verify`, and receive a valid JWT
  for the victim — full account takeover with no access to the victim's key. Verification
  now enforces the full challenge-event contract (kind 22242, a `['challenge', nonce]`
  tag, event-id/hash integrity, valid signature, fresh timestamp) via `validateChallengeEvent`,
  and binds the signed event to the exact issued challenge nonce in **both** the in-memory
  and Supabase storage branches before deleting the row and returning success.
- **`generateChallenge()` no longer replayable.** The exported helper used the (public,
  constant) pubkey as the challenge value with fixed content, providing zero freshness.
  It now generates a cryptographically-random 32-byte nonce in the `['challenge', nonce]`
  tag, binds the target pubkey via a separate `['p', pubkey]` tag, and returns the nonce
  alongside the signed event so callers can enforce single-use.

### Fixed
- In-memory challenge verification matched the raw stored challenge against the templated
  event `content`, so the bundled `NostrBrowserAuth` / `Nip46AuthHandler` clients could
  **never** authenticate in the default (no-Supabase) deployment ("Challenge not found").
  Both branches now match on the canonical `['challenge', nonce]` tag.
- `verifyChallenge` accepted any event kind — a non-challenge event (kind 1/0, DM, ...)
  signed by the target was treated as a valid response. Kind 22242 (or configured
  `customKind`) is now enforced on the verification path.
- `generateEventHash()` returned a Promise while being typed `string`, so every event-id
  integrity check (`validateChallengeEvent` / `validateEnrollmentEvent`) compared a Promise
  against a string and **always** reported a hash mismatch. It is now `async` and awaited.
- Client/server HTTP method mismatch: clients fetch `GET /challenge/:pubkey` but the router
  only registered `POST`. `GET` is now registered (POST kept for compatibility).
- Supabase `createChallenge` never cleared prior rows and `verifyChallenge` used `.single()`,
  so a second challenge request (reload/retry/double-click) left multiple rows and locked
  the user out. Prior rows are now cleared on issue, and lookup uses
  `.order().limit(1).maybeSingle()`.
- `Nip46AuthHandler.authenticate()` discarded the server-issued JWT; it now parses the
  `/verify` response body and returns `token` (added to `Nip46AuthResult`).
- `validateEvent` rejected validly-signed events with empty `content` (spec-legal per
  NIP-01) as "Missing required fields"; it now only requires `content` to be a string.

### Changed (breaking)
- Challenge/verification contract standardized on the `['challenge', nonce]` tag. Clients
  MUST sign a kind-22242 event carrying `['challenge', <issued challenge>]`; events whose
  id is not the canonical hash, whose kind is not 22242, or which are not bound to the
  issued challenge are now rejected.
- `generateChallenge()` return type changed from `Promise<NostrEvent>` to
  `Promise<{ event: NostrEvent; challenge: string }>`.
- `generateEventHash()` is now `async` (`Promise<string>`) and must be awaited.

### Added
- End-to-end tests that run `createChallenge -> construct/sign the exact client event ->
  verifyChallenge` with real crypto and **no** NostrService mock, for both the in-memory
  and stubbed-Supabase branches (happy path, account-takeover rejection, nonce uniqueness,
  replay rejection, tamper/lockout).
- Exported `getChallengeTagValue()` and `DEFAULT_CHALLENGE_KIND` (the canonical contract).

## [0.5.0] - 2026-03-08

### Added
- **NIP-46 Remote Signer Support** — full client and server-side NIP-46 authentication
- `Nip46SignerMiddleware` — Express middleware that acts as a NIP-46 signer
  - `POST /request` — receive and respond to kind 24133 events
  - `GET /info` — signer metadata (pubkey, relays, supported methods)
  - `GET /bunker-uri` — generate bunker:// connection URI
  - In-memory session tracking with configurable timeout and periodic cleanup
- `Nip46AuthHandler` — browser-side handler for authenticating via remote signers (bunkers)
  - Transport-agnostic via `Nip46Transport` interface (consumer provides relay I/O)
  - `connect()` / `authenticate()` / `validateSession()` / `destroy()` lifecycle
- `createNip46Signer()` factory function (mirrors `createNostrAuth()` pattern)
- New types: `Nip46AuthConfig`, `Nip46SignerConfig`, `Nip46AuthResult`
- `nostr-crypto-utils/nip46` subpath module declaration in type definitions
- esbuild alias for `nostr-crypto-utils/nip46` in browser bundle
- 25 new tests (13 signer middleware, 12 auth handler)
- Updated documentation: README, API reference, authentication flow, browser auth guide

### Changed
- `nostr-crypto-utils` dependency upgraded from ^0.6.0 to ^0.7.0

## [0.4.0] - 2026-03-06

### Changed
- Migrated build system from webpack to esbuild
- Upgraded to Noble 2.0 (`@noble/curves` ^2.0.1, `@noble/hashes` ^2.0.1)
- Upgraded to vitest 4, ESLint 10
- Zero production vulnerabilities

## [0.3.5] - 2025-02-19

### Changed
- Updated dependencies to latest within major versions

## [0.3.4] - 2025-02-09

### Added
- Session verification support for browser environments
- TypeScript definitions for window.nostr interface
- Improved error handling for session verification

### Changed
- Enhanced browser compatibility checks
- Better error messages for session-related operations

## [0.3.3] - 2025-02-01

### Added
- JWT secret validation at startup

## [0.3.2] - 2025-01-25

### Added
- Comprehensive JWT configuration and browser compatibility documentation

## [0.3.1] - 2025-01-20

### Changed
- Included documentation in npm package

## [0.3.0] - 2025-01-15

### Changed
- Major codebase improvements and documentation updates
- Removed Node.js 16.x support, upgraded GitHub Actions to v4
- Prepared for npm publish

## [0.2.6] - 2024-01-09

### Added
- New TypeScript interfaces in `interfaces/nostr.interface.ts` for better type safety
- More comprehensive event validation with detailed error messages

### Changed
- Improved event validation with stricter type checking
- Better error handling and logging in event validator
- Updated to use latest crypto utilities

## [0.2.5] - 2023-12-08

### Changed
- Updated to use published versions of nostr-crypto-utils and nostr-nsec-seedphrase
- Updated key generation to use new generateKeyPairWithSeed function

## [0.2.3] - 2023-12-06

### Added
- Comprehensive test suite with 94.8% coverage
- Tests for challenge generation and verification
- Tests for profile fetching
- Tests for enrollment and verification
- Tests for error handling
- Tests for router integration

### Changed
- Updated README with testing documentation
- Improved error handling in middleware
- Enhanced TypeScript type safety

## [0.2.2] - 2023-12-01

### Added
- Initial implementation of Nostr authentication middleware
- NIP-07 compatible authentication
- Secure user enrollment with Nostr
- Comprehensive event validation
- Advanced cryptographic operations
- Supabase integration for data persistence
- JWT-based session management
