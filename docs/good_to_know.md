# Good to Know

## TypeScript and ES Modules Requirements

This middleware component heavily relies on Nostr-related tools and libraries, which necessitates the use of both TypeScript and ES Modules. This is not just a preference, but a requirement to avoid numerous conflicts and compatibility issues:

1. **TypeScript Benefits**:
   - Provides proper type definitions for Nostr events and cryptographic functions
   - Helps catch potential errors in event handling and signing
   - Makes refactoring and maintenance much safer
   - Ensures consistency in data structures across the codebase

2. **ES Modules Requirement**:
   - Many Nostr-related packages (like `nostr-tools`) are distributed as ES Modules
   - Using CommonJS (`require`) can lead to compatibility issues, especially with cryptographic functions
   - ES Modules provide better tree-shaking and bundle optimization
   - Ensures consistent import/export behavior across the codebase

3. **PM2 Configuration Exception**:
   - While the main codebase uses ES Modules, PM2 configuration files must use CommonJS format
   - The `ecosystem.config.cjs` file is the only file that should use CommonJS
   - This is because PM2 itself is built on CommonJS and doesn't fully support ES Modules in its configuration files

4. **Configuration Requirements**:
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "module": "Node16",
       "moduleResolution": "node16",
       // ... other options
     }
   }
   ```
   ```json
   // package.json
   {
     "type": "module"
   }
   ```

5. **Import Syntax**:
   - Always use `.js` extension in import paths for local modules
   - Example: `import { something } from './utils/something.js';`
   - Exception: Don't add extensions for npm package imports

Following these requirements will save you from many common issues when using and modifying this middleware component.