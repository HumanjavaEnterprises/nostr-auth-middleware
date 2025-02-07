# Development Checklist

## Version Requirements
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

## Package Configuration
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

## Build Configuration

### TypeScript Configuration
- [ ] Use `NodeNext` for both `module` and `moduleResolution` in tsconfig.json
- [ ] Include `tslib` in dependencies for TypeScript helpers
- [ ] Use `.js` extensions in import statements (TypeScript convention for ESM)
- [ ] Configure separate tsconfig files for different build targets (browser, CJS, ESM)
- [ ] Handle type definitions:
  - [ ] Consider inlining small type definitions instead of separate files
  - [ ] Use declaration merging for global types (e.g., window object)

### Webpack Configuration
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

## Testing
- [ ] Configure test environment properly:
  - [ ] Set up test globals
  - [ ] Configure coverage reporting
  - [ ] Ensure tests run in both ESM and CommonJS environments
- [ ] Test browser bundle in different environments
- [ ] Run tests across supported Node.js versions
- [ ] Verify package exports work in different environments

## Development Workflow
- [ ] Run builds and tests before committing changes
- [ ] Update documentation when making significant changes
- [ ] Keep track of bundle size and performance impacts
- [ ] Document any workarounds or special configurations

## Browser Integration
- [ ] Test browser bundle in different environments
- [ ] Verify global object access works correctly
- [ ] Check for any Node.js-specific code that needs browser alternatives
- [ ] Ensure proper error handling for browser-specific features

## Dependencies
- [ ] Keep dependencies up to date
- [ ] Document any specific version requirements
- [ ] Consider the impact of dependencies on bundle size
- [ ] Use appropriate dependency types (dependencies vs devDependencies)
- [ ] Include necessary TypeScript helpers (e.g., tslib)

## Common Issues and Solutions

1. Module Resolution:
   - Use `.js` extensions in imports
   - Configure proper `moduleResolution` in TypeScript
   - Set up webpack `extensionAlias`
   - Handle `.d.ts` files appropriately

2. Package Exports:
   - Order matters in package.json exports
   - Put "types" condition first
   - Include standard package.json fields
   - Test both ESM and CommonJS imports

3. Type Definition Handling:
   - Consider inlining vs separate files
   - Use declaration merging for globals
   - Handle `.d.ts` files in build process
   - Document complex types

4. Build Process:
   - Test all build targets
   - Check for proper source map generation
   - Verify bundle size and optimization
   - Test in supported Node.js versions

5. Browser Compatibility:
   - Configure Node.js polyfills
   - Handle global object access
   - Test in target environments
   - Consider bundle size optimization
