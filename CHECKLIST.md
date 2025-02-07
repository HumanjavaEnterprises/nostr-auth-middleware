# Development Checklist

## Build Configuration

### TypeScript Configuration
- [ ] Use `NodeNext` for both `module` and `moduleResolution` in tsconfig.json
- [ ] Include `tslib` in dependencies for TypeScript helpers
- [ ] Use `.js` extensions in import statements (TypeScript convention for ESM)
- [ ] Ensure declaration files (`.d.ts`) are properly handled in build process
- [ ] Configure separate tsconfig files for different build targets (browser, CJS, ESM)

### Webpack Configuration
- [ ] Configure proper module resolution:
  - [ ] Add `.js` extension alias for `.ts` files
  - [ ] Handle `.d.ts` files appropriately (ignore or process)
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
  npm run build
  ```
- [ ] Verify all build targets work:
  - [ ] TypeScript declarations
  - [ ] CommonJS build
  - [ ] ESM build
  - [ ] Browser bundle
- [ ] Check bundle size and consider optimizations if needed
- [ ] Ensure source maps are generated correctly

## Type Definitions
- [ ] Keep type definitions close to their usage
- [ ] Consider inlining small type definitions instead of separate files
- [ ] Use declaration merging for global types (e.g., window object)
- [ ] Document complex types with JSDoc comments

## Development Workflow
- [ ] Run builds before committing changes
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

## Common Issues and Solutions
1. Module Resolution:
   - Use `.js` extensions in imports
   - Configure proper `moduleResolution` in TypeScript
   - Set up webpack `extensionAlias`

2. Type Definition Handling:
   - Inline small type definitions
   - Use declaration merging for globals
   - Handle `.d.ts` files appropriately in build

3. Build Process:
   - Test all build targets
   - Check for proper source map generation
   - Verify bundle size and optimization

4. Browser Compatibility:
   - Configure Node.js polyfills
   - Handle global object access
   - Test in target environments
