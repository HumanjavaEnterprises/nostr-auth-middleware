# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.6] - 2023-12-05

### Added
- New TypeScript interfaces in `interfaces/nostr.interface.ts` for better type safety
- More comprehensive event validation with detailed error messages

### Enhanced
- Improved event validation with stricter type checking
- Better error handling and logging in event validator
- Updated to use latest crypto utilities

## [0.2.5] - 2024-01-09

### Changed
- Updated to use published versions of @humanjavaenterprises/nostr-crypto-utils@0.2.0 and @humanjavaenterprises/nostr-nsec-seedphrase-library@0.2.0
- Updated key generation to use new generateKeyPairWithSeed function from nostr-nsec-seedphrase-library

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

## [0.2.2] - Previous Release

### Added
- Initial implementation of Nostr authentication middleware
- NIP-07 compatible authentication
- Secure user enrollment with Nostr
- Comprehensive event validation
- Advanced cryptographic operations
- Supabase integration for data persistence
- JWT-based session management
