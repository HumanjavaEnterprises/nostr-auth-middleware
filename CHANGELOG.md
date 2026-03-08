# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
