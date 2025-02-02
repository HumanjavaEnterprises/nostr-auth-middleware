# Development Strategy

## Purpose
This document outlines the key architectural decisions, development patterns, and modernization strategies for the nostr-auth-middleware project. It serves as a living document to help maintain consistency across development sessions and preserve the reasoning behind important technical decisions.

## Core Architecture Principles

### 1. Single Responsibility
- **Authentication Only**: Middleware focuses solely on Nostr key-based authentication
- **No Business Logic**: Business rules, user tiers, and application logic belong in the API layer
- **Simple JWT**: Issues basic JWTs with minimal claims (npub, timestamp)

### 2. Security First
- **Open Source**: Fully auditable security-critical code
- **Transparent**: Clear, readable implementation
- **Focused Scope**: Does one thing well - Nostr authentication

### 3. Integration Architecture
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

### 4. Environment-Aware Design
#### Development Mode Features
- Local directory structure
- Auto-generated test keys
- In-memory data storage option
- Hot-reloading enabled
- Detailed logging
- No root permissions required

#### Production Mode Features
- System-level directory structure
- Secure key management via Supabase
- Proper file permissions
- Log rotation and compression
- Automatic backups
- Rate limiting
- IP whitelisting

## Module System Strategy

### Hybrid Module Support (ESM/CommonJS)
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

### Import/Export Patterns
1. **Local Imports**
   - Must include `.js` extension for ESM compatibility
   - Example: `import { NostrService } from '../services/nostr.service.js'`

2. **External Package Imports**
   - Do not include `.js` extension
   - Example: `import { hexToBytes } from '@noble/hashes/utils'`

3. **Type Imports**
   - Use explicit type imports for better tree-shaking
   - Example: `import type { NostrAuthConfig } from './types/index.js'`

## Testing Strategy

### Vitest Over Jest
- Chose Vitest for:
  - Native ESM support
  - Better TypeScript integration
  - Improved performance
  - Modern tooling compatibility
  - Simpler configuration

### Test Organization
- Unit tests located in `src/__tests__`
- Integration tests in `scripts/test-auth.sh`
- Live testing via `scripts/test-auth-live.ts`

## Build System

### Multiple Build Targets
1. **TypeScript Declarations**
   - Generated using `tsconfig.types.json`
   - Outputs to `dist/types`

2. **CommonJS Build**
   - Uses `tsconfig.cjs.json`
   - Outputs to `dist/cjs`
   - Maintains backward compatibility

3. **ESM Build**
   - Uses `tsconfig.esm.json`
   - Outputs to `dist/esm`
   - Primary modern entry point

4. **Browser Bundle**
   - Generated using webpack
   - UMD format for broad compatibility
   - External dependencies properly configured

## Type System

### TypeScript Configuration
- Uses `"moduleResolution": "NodeNext"` for modern resolution
- Strict type checking enabled
- Separate configs for different build targets
- Preserves source maps and declaration maps

### Type Exports
- Types available for both ESM and CommonJS
- Browser-specific type declarations
- Global type augmentation for UMD bundle

## Development Workflow

### Local Development
1. Use `npm run dev` for development server
2. Run `npm test` for Vitest test suite
3. Use `npm run build` to verify all build targets

### Environment Configuration
```bash
# Core Configuration
NODE_ENV=development                    # development or production
DOMAIN=nostr-platform.app              # your domain
SERVICE_NAME=auth                      # service identifier

# Service URLs
AUTH_SERVICE_URL=http://localhost:3002  # becomes https://auth.your-domain.app
IPFS_SERVICE_URL=http://localhost:3001  # becomes https://ipfs.your-domain.app
RELAY_SERVICE_URL=http://localhost:3000 # becomes https://relay.your-domain.app

# Security Configuration
SERVER_PRIVATE_KEY=                    # auto-generated if not provided
SERVER_PUBLIC_KEY=                     # auto-generated if not provided
JWT_SECRET=your_jwt_secret            # required in production

# Supabase Configuration
SUPABASE_PROJECT=your-project         # project identifier
SUPABASE_URL=your_supabase_url       # required in production
SUPABASE_KEY=your_supabase_key       # required in production
```

### Directory Structure
#### Development
- Source code in `src/`
- Tests in `src/__tests__/`
- Build output in `dist/`
- Scripts in `scripts/`
- Documentation in `docs/`

#### Production
- Deploy directory: `/opt/nostr-platform/auth`
- Backup directory: `/opt/backups/nostr`
- Log directory: `/var/log/nostr-platform`

### Code Organization
- Core middleware in `src/middleware`
- Utilities in `src/utils`
- Types in `src/types`
- Services in `src/services`

### Code Style
- ESLint configured for TypeScript
- Prettier for consistent formatting
- Enforced `.js` extensions in imports
- Explicit type imports/exports

## Security Considerations
⚠️ **Critical Security Notes**
- Handles cryptographic keys and authentication tokens
- Private keys (`nsec`) and authentication tokens require secure storage
- Developers must inform users about key management responsibilities
- No hardcoding of sensitive values
- Regular security audits recommended

## Deployment Strategy
### Scripts and Automation
- `startup.sh`: Service initialization and startup
  - Environment detection
  - Directory creation
  - Permission setting
  - Service startup
- `shutdown.sh`: Clean service shutdown
  - Process termination
  - Log rotation
  - Cleanup operations
- `config.sh`: Configuration management
  - Environment detection
  - Variable validation

### Process Management
- PM2 for process management
- Environment variables via dotenv
- Separate configurations for different environments
- Automated deployment scripts

## Future Considerations
1. Browser bundle optimization
2. Additional type safety improvements
3. Performance monitoring
4. Integration with other Nostr tools
5. WebSocket support enhancement
6. Enhanced backup strategies
7. Advanced rate limiting options
8. Geographic distribution support
