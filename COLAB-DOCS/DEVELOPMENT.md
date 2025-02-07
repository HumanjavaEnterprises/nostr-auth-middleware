# Development Guide

## Strategy and Architecture

### Purpose
This document outlines the key architectural decisions, development patterns, and modernization strategies for the nostr-auth-middleware project. It serves as a living document to help maintain consistency across development sessions and preserve the reasoning behind important technical decisions.

### Core Architecture Principles

#### 1. Single Responsibility
- **Authentication Only**: Middleware focuses solely on Nostr key-based authentication
- **No Business Logic**: Business rules, user tiers, and application logic belong in the API layer
- **Simple JWT**: Issues basic JWTs with minimal claims (npub, timestamp)

#### 2. Security First
- **Open Source**: Fully auditable security-critical code
- **Transparent**: Clear, readable implementation
- **Focused Scope**: Does one thing well - Nostr authentication

#### 3. Integration Architecture
```plaintext
┌─────────────────┐
│   Client App    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Nostr Auth     │ ◄── This Service
│   Service       │     Simple Auth Only
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  App Platform   │ ◄── Your Business Logic
│     API         │     User Tiers
└─────────────────┘     Rate Limits
```

#### 4. Environment-Aware Design
##### Development Mode Features
- Local directory structure
- Auto-generated test keys
- In-memory data storage option
- Hot-reloading enabled
- Detailed logging
- No root permissions required

##### Production Mode Features
- System-level directory structure
- Secure key management via Supabase
- Proper file permissions
- Log rotation and compression
- Automatic backups
- Rate limiting
- IP whitelisting

## Development Checklist

### Version Requirements
- [ ] Specify Node.js version requirements:
  ```json
  {
    "engines": {
      "node": ">=18.0.0"  // Only support active LTS versions
    }
  }
  ```
- [ ] Document version requirements in README.md
- [ ] Configure CI to test only supported versions
- [ ] Remove legacy version support and polyfills

### Package Configuration
- [ ] Configure package.json exports properly:
  ```json
  {
    "exports": {
      ".": {
        "types": "./dist/types/index.d.ts",  // Types must come first
        "import": "./dist/esm/index.js",
        "require": "./dist/cjs/index.js"
      }
    }
  }
  ```
- [ ] Include standard fields at root level:
  - [ ] "main" for CommonJS entry
  - [ ] "module" for ESM entry
  - [ ] "types" for TypeScript types
  - [ ] "browser" for browser bundles

### Module System Strategy

#### Hybrid Module Support (ESM/CommonJS)
- Package supports both ESM and CommonJS through dual publishing
- Entry points defined in package.json:
  ```json
  {
    "main": "./dist/cjs/index.js",    // CommonJS
    "module": "./dist/esm/index.js",  // ESM
    "types": "./dist/types/index.d.ts" // TypeScript
  }
  ```
- Browser bundle available at `dist/browser/nostr-auth-middleware.min.js`

#### TypeScript Declaration Patterns
- Browser-specific declarations in `browser.d.ts` follow top-level pattern:
  ```typescript
  // Define interfaces and types at top level
  interface NostrAuthConfig { ... }
  interface NostrEvent { ... }
  
  // Declare classes at top level
  declare class NostrAuthClient { ... }
  
  // Global augmentations after type definitions
  declare global {
    interface Window {
      NostrAuthMiddleware: typeof NostrAuthClient;
    }
  }
  
  // Single export at the end
  export = NostrAuthClient;
  ```
- Avoid module augmentation blocks (`declare module`) in browser declarations
- Keep type definitions close to their implementation files

### Build Configuration

#### TypeScript Configuration
- [ ] Use `NodeNext` for both `module` and `moduleResolution` in tsconfig.json
- [ ] Include `tslib` in dependencies for TypeScript helpers
- [ ] Use `.js` extensions in import statements (TypeScript convention for ESM)
- [ ] Configure separate tsconfig files for different build targets (browser, CJS, ESM)
- [ ] Handle type definitions:
  - [ ] Consider inlining small type definitions instead of separate files
  - [ ] Use declaration merging for global types (e.g., window object)

#### Webpack Configuration
- [ ] Configure proper module resolution:
  - [ ] Add `.js` extension alias for `.ts` files
  - [ ] Handle `.d.ts` files appropriately (use ignore-loader)
  - [ ] Set up Node.js polyfills or fallbacks for browser environment
- [ ] Configure TypeScript loader:
  - [ ] Use `ts-loader` with appropriate options
  - [ ] Enable `transpileOnly` for faster builds
  - [ ] Set correct module resolution strategy
- [ ] Handle external dependencies properly:
  - [ ] Mark Node.js-only packages as external
  - [ ] Configure fallbacks for Node.js core modules

### Build Process
- [ ] Test builds before committing changes:
  ```bash
  npm run build && npm test
  ```
- [ ] Verify all build targets work:
  - [ ] TypeScript declarations
  - [ ] CommonJS build
  - [ ] ESM build
  - [ ] Browser bundle
- [ ] Check bundle size and consider optimizations if needed
- [ ] Ensure source maps are generated correctly

### Testing
- [ ] Configure test environment properly:
  - [ ] Set up test globals
  - [ ] Configure coverage reporting
  - [ ] Ensure tests run in both ESM and CommonJS environments
- [ ] Test browser bundle in different environments
- [ ] Run tests across supported Node.js versions
- [ ] Verify package exports work in different environments

### Development Workflow
- [ ] Run builds and tests before committing changes
- [ ] Update documentation when making significant changes
- [ ] Keep track of bundle size and performance impacts
- [ ] Document any workarounds or special configurations

### Browser Integration
- [ ] Test browser bundle in different environments
- [ ] Verify global object access works correctly
- [ ] Check for any Node.js-specific code that needs browser alternatives
- [ ] Ensure proper error handling for browser-specific features

### Dependencies
- [ ] Keep dependencies up to date
- [ ] Document any specific version requirements
- [ ] Consider the impact of dependencies on bundle size
- [ ] Use appropriate dependency types (dependencies vs devDependencies)
- [ ] Include necessary TypeScript helpers (e.g., tslib)

### Common Issues and Solutions

#### Type assertions and casting:
- [ ] Avoid using `as unknown as Type` when possible
- [ ] Create proper type guards for runtime checks
- [ ] Use type predicates for narrowing types

#### External library types:
- [ ] Maintain proper type definitions for external libraries
- [ ] Use declaration merging for extending third-party types
- [ ] Document any type-related workarounds or limitations
