# Nostr Auth Middleware Test Cases

## Prerequisites

### Development Environment
```bash
# Set environment
export NODE_ENV=development

# Start the server in development mode
npm run dev
```

### Production Environment
```bash
# Set environment
export NODE_ENV=production

# Start the server in production mode
npm run start
```

## Test Categories

### 1. Environment Configuration Tests

#### Development Mode
```bash
# Test development directory structure
./scripts/tests/test-auth.sh --env development --test directories

# Test development permissions
./scripts/tests/test-auth.sh --env development --test permissions

# Test configuration loading
./scripts/tests/test-auth.sh --env development --test config
```

#### Production Mode
```bash
# Test production directory structure
sudo ./scripts/tests/test-auth.sh --env production --test directories

# Test production permissions
sudo ./scripts/tests/test-auth.sh --env production --test permissions

# Test configuration loading
sudo ./scripts/tests/test-auth.sh --env production --test config
```

### 2. Authentication Flow Tests

#### Request Challenge
```bash
curl -X POST http://localhost:3000/auth/nostr/challenge \
  -H "Content-Type: application/json" \
  -d '{
    "pubkey": "npub1...your_public_key"
  }'

# Expected Response:
# {
#   "challengeId": "abc123...",
#   "event": {
#     "kind": 22242,
#     "created_at": 1234567890,
#     "content": "Challenge for authentication: abc123...",
#     "tags": [["p", "npub1...your_public_key"]],
#     "pubkey": "server_pubkey..."
#   }
# }
```

#### Verify Challenge Response
```bash
curl -X POST http://localhost:3000/auth/nostr/verify \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": "abc123...",
    "signedEvent": {
      "kind": 22242,
      "created_at": 1234567890,
      "content": "Challenge response: abc123...",
      "tags": [
        ["p", "server_pubkey..."],
        ["e", "challenge_event_id..."]
      ],
      "pubkey": "npub1...your_public_key",
      "id": "signed_event_id...",
      "sig": "signature..."
    }
  }'

# Expected Response:
# {
#   "success": true,
#   "token": "jwt_token...",
#   "profile": {
#     "pubkey": "npub1...",
#     "name": "User Name",
#     "about": "About me",
#     "picture": "https://..."
#   }
# }
```

### 3. Enrollment Tests

#### Start Enrollment
```bash
curl -X POST http://localhost:3000/auth/nostr/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "pubkey": "npub1...your_public_key"
  }'

# Expected Response:
# {
#   "verificationEvent": {
#     "kind": 22243,
#     "created_at": 1234567890,
#     "content": "Enrollment verification request",
#     "tags": [["p", "npub1...your_public_key"]],
#     "pubkey": "server_pubkey..."
#   },
#   "expiresAt": 1234567890
# }
```

#### Verify Enrollment
```bash
curl -X POST http://localhost:3000/auth/nostr/enroll/verify \
  -H "Content-Type: application/json" \
  -d '{
    "signedEvent": {
      "kind": 22243,
      "created_at": 1234567890,
      "content": "Enrollment verification response",
      "tags": [
        ["p", "server_pubkey..."],
        ["e", "verification_event_id..."]
      ],
      "pubkey": "npub1...your_public_key",
      "id": "signed_event_id...",
      "sig": "signature..."
    }
  }'

# Expected Response:
# {
#   "success": true,
#   "message": "Enrollment verified"
# }
```

### 4. Key Management Tests

#### Development Mode
```bash
# Test local key generation
./scripts/tests/test-auth.sh --env development --test keys

# Test key persistence
./scripts/tests/test-auth.sh --env development --test key-persistence
```

#### Production Mode
```bash
# Test Supabase key management
sudo ./scripts/tests/test-auth.sh --env production --test keys

# Test key rotation
sudo ./scripts/tests/test-auth.sh --env production --test key-rotation
```

### 5. Logging Tests

#### Development Mode
```bash
# Test local logging
./scripts/tests/test-auth.sh --env development --test logging

# Test log rotation
./scripts/tests/test-auth.sh --env development --test log-rotation
```

#### Production Mode
```bash
# Test system logging
sudo ./scripts/tests/test-auth.sh --env production --test logging

# Test log management
sudo ./scripts/tests/test-auth.sh --env production --test log-management
```

## Automated Test Suite

Run the complete test suite:

```bash
# Development environment
npm run test:dev

# Production environment
npm run test:prod
```

## Test Coverage

Generate and view test coverage report:

```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/index.html
```
