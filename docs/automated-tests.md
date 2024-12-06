# Automated Tests Documentation

This document provides detailed information about the automated test suite for the Nostr Auth Middleware.

## Overview

The test suite provides comprehensive coverage (94.8%) of the middleware's functionality, ensuring reliable and secure authentication operations.

## Test Categories

### 1. Challenge Generation Tests
- Validates proper challenge creation with valid pubkey
- Ensures appropriate error handling for missing pubkey
- Tests challenge format and expiration time
- Verifies proper error responses for invalid inputs

### 2. Challenge Verification Tests
- Tests successful verification of valid challenges
- Validates signature verification process
- Checks error handling for invalid signatures
- Ensures proper handling of expired challenges
- Tests response format for successful and failed verifications

### 3. Profile Fetching Tests
- Verifies successful profile retrieval
- Tests error handling for non-existent profiles
- Validates response format for profile data
- Ensures proper error messages for invalid pubkeys

### 4. Enrollment Tests
- Tests successful enrollment initiation
- Validates enrollment verification process
- Checks error handling for invalid enrollment attempts
- Tests enrollment state management
- Verifies proper response formats

### 5. Router Integration Tests
- Validates proper route setup
- Tests middleware integration
- Verifies router configuration
- Ensures proper handling of HTTP methods

## Running Tests

### Standard Test Suite
```bash
npm test
```
This runs the complete test suite using Jest.

### Live Testing
```bash
npm run test:live
```
Tests integration with actual Nostr relays.

### Authentication Flow Testing
```bash
npm run test:auth
```
Tests the complete authentication flow.

## Test Configuration

The test suite uses the following configuration:

```typescript
// jest.config.js
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov']
}
```

## Coverage Report

Current test coverage statistics:
```plaintext
---------------------------|---------|----------|---------|---------|-------------------
File                       | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
---------------------------|---------|----------|---------|---------|-------------------
All files                  |    94.8 |      100 |     100 |   94.73 |                   
 middleware                |   94.36 |      100 |     100 |   94.36 |                   
  nostr-auth.middleware.ts |   94.36 |      100 |     100 |   94.36 | 90-91,112-113     
 utils                     |     100 |      100 |     100 |     100 |                   
  logger.ts                |     100 |      100 |     100 |     100 |                   
---------------------------|---------|----------|---------|---------|-------------------
```

## Writing New Tests

When adding new functionality, please follow these guidelines for writing tests:

1. **Test Organization**
   - Place tests in the `__tests__` directory
   - Name test files with `.test.ts` extension
   - Group related tests using `describe` blocks
   - Use clear, descriptive test names

2. **Test Structure**
   ```typescript
   describe('Feature', () => {
     beforeEach(() => {
       // Setup
     });

     it('should do something specific', async () => {
       // Test implementation
     });

     afterEach(() => {
       // Cleanup
     });
   });
   ```

3. **Mocking**
   - Use Jest's mocking capabilities for external dependencies
   - Create mock implementations that match real behavior
   - Reset mocks between tests

4. **Error Handling**
   - Test both success and failure cases
   - Verify error messages and status codes
   - Test edge cases and boundary conditions

## Continuous Integration

The test suite is integrated into the CI/CD pipeline:
- Tests run automatically on pull requests
- Coverage reports are generated and tracked
- Failed tests block merging

## Troubleshooting Tests

Common issues and solutions:

1. **TypeScript Errors**
   - Ensure proper type definitions
   - Check import paths
   - Verify mock type definitions

2. **Test Timeouts**
   - Increase timeout for async tests if needed
   - Check for unresolved promises
   - Verify mock implementations

3. **Coverage Issues**
   - Add tests for uncovered lines
   - Check conditional branches
   - Verify error handling paths

## Future Improvements

Planned enhancements to the test suite:

1. Add integration tests with multiple relay configurations
2. Implement performance benchmarking tests
3. Add stress testing for concurrent operations
4. Expand API endpoint testing coverage
