# Purpose
This CHECKLIST.md serves as an active memory document for the nostr-auth-middleware project. It is designed to maintain consistency across development sessions and AI collaboration sessions, ensuring that all contributors (human and AI) follow the same modernization guidelines and architectural decisions. This document should be consulted before making significant changes to the project structure or build system.

---

# Development Checklist and Notes

## Core Requirements
1. Single Responsibility Principle
   - [ ] New features must ONLY handle authentication-related functionality
   - [ ] Business logic must remain in the API layer
   - [ ] JWT claims must stay minimal (npub, timestamp only)

2. Security Requirements
   - [ ] No sensitive data in code or comments
   - [ ] No hardcoded keys or secrets
   - [ ] All cryptographic operations must use approved libraries
   - [ ] Environment variables must be properly validated
   - [ ] Security-critical code must include tests
   - [ ] All authentication flows must be documented

## Package Structure
- Package should be set up as a hybrid CommonJS/ESM module
- Main entry points should be defined in package.json:
  - CommonJS: `./dist/cjs/index.js`
  - ESM: `./dist/esm/index.js`
  - TypeScript types: `./dist/types/index.d.ts`
  - Browser bundle: `./dist/browser/nostr-auth-middleware.min.js`

## Build Process
1. Multiple build targets required:
   - `npm run build:types` - Generate TypeScript declaration files
   - `npm run build:cjs` - Build CommonJS modules
   - `npm run build:esm` - Build ES modules
   - `npm run build:browser` - Create browser bundles using webpack
   - `npm run build` - Run all builds in sequence

2. Build Configuration:
   - ESM build must use Node16 module resolution
   - All relative imports in ESM must include `.js` extensions
   - Browser bundle should be configured with webpack
   - Preserve all existing test and deployment scripts

## Dependencies
1. External Dependencies:
   - Replace local file dependencies with published versions:
     - @humanjavaenterprises/nostr-crypto-utils
     - @humanjavaenterprises/nostr-nsec-seedphrase-library
   - Keep core dependencies up to date while maintaining compatibility

2. Development Dependencies:
   - Add webpack and related build tools
   - Maintain Vitest test framework
   - Keep TypeScript and related tools

## Environment Handling
1. Development Mode Requirements
   - [ ] Use local directory structure
   - [ ] Enable detailed logging
   - [ ] Support hot-reloading
   - [ ] Use in-memory storage when appropriate

2. Production Mode Requirements
   - [ ] Implement proper file permissions
   - [ ] Enable log rotation
   - [ ] Configure rate limiting
   - [ ] Set up IP whitelisting
   - [ ] Enable automatic backups

## Testing Guidelines
1. Test Coverage Requirements
   - [ ] All security-critical code must have 100% coverage
   - [ ] All authentication flows must have integration tests
   - [ ] All API endpoints must have tests
   - [ ] All error conditions must be tested

2. Test Organization
   - [ ] Unit tests in `src/__tests__`
   - [ ] Integration tests using test scripts
   - [ ] Live testing configurations separate

## Documentation Requirements
1. Code Documentation
   - [ ] All public APIs must have JSDoc comments
   - [ ] All security-critical functions must be documented
   - [ ] All configuration options must be documented
   - [ ] All error conditions must be documented

2. Architectural Documentation
   - [ ] Update architecture diagrams when changing flows
   - [ ] Document all environment variables
   - [ ] Maintain security considerations section
   - [ ] Update deployment instructions

## Deployment Process
1. Pre-deployment Checklist
   - [ ] All tests passing
   - [ ] Security audit completed
   - [ ] Environment variables validated
   - [ ] Backup strategy confirmed

2. Deployment Requirements
   - [ ] Use PM2 for process management
   - [ ] Configure proper directory permissions
   - [ ] Set up log rotation
   - [ ] Configure monitoring

## Code Review Requirements
1. Security Checks
   - [ ] No sensitive data exposure
   - [ ] Proper error handling
   - [ ] Input validation
   - [ ] Rate limiting where needed

2. Architecture Checks
   - [ ] Maintains single responsibility
   - [ ] No business logic in auth layer
   - [ ] Proper separation of concerns
   - [ ] Follows established patterns
