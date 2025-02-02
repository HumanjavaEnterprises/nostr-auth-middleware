# Development Checklist and Notes

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
   - Maintain existing test framework (Jest)
   - Keep TypeScript and related tools

## Module Resolution
1. TypeScript Configuration:
   - Update tsconfig.json for dual CJS/ESM output
   - Add separate configs for different build targets
   - Maintain strict type checking

2. Package Exports:
   - Configure package.json exports field for proper resolution
   - Support both import and require syntax
   - Maintain TypeScript types accessibility

## Testing Guidelines
1. Run full test suite after any build changes
2. Test all module formats:
   - CommonJS (`require`)
   - ESM (`import`)
   - Browser bundle
3. Maintain existing test coverage

## Deployment Process
1. Preserve all existing deployment scripts
2. Update CI/CD if needed for new build process
3. Maintain PM2 configuration
