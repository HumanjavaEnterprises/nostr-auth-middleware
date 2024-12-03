# Nostr Auth Middleware Test Cases

## Prerequisites
```bash
# Start the server (assuming it's running on localhost:3000)
npm run dev
```

## Test Cases

### 1. Request Challenge
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

### 2. Verify Challenge Response
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

### 3. Start Enrollment
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

### 4. Verify Enrollment
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
#   "message": "Enrollment successful",
#   "profile": {
#     "pubkey": "npub1...",
#     "name": "User Name",
#     "about": "About me",
#     "picture": "https://..."
#   }
# }
```

### 5. Fetch Profile
```bash
curl -X GET http://localhost:3000/auth/nostr/profile/npub1...your_public_key

# Expected Response:
# {
#   "pubkey": "npub1...",
#   "name": "User Name",
#   "about": "About me",
#   "picture": "https://...",
#   "nip05": "user@domain.com",
#   "lud16": "lightning_address"
# }
```

## Error Cases

### 1. Invalid Public Key
```bash
curl -X POST http://localhost:3000/auth/nostr/challenge \
  -H "Content-Type: application/json" \
  -d '{
    "pubkey": "invalid_key"
  }'

# Expected Response:
# {
#   "error": "Invalid public key format"
# }
```

### 2. Expired Challenge
```bash
curl -X POST http://localhost:3000/auth/nostr/verify \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": "expired_id",
    "signedEvent": { ... }
  }'

# Expected Response:
# {
#   "error": "Challenge has expired"
# }
```

### 3. Invalid Signature
```bash
curl -X POST http://localhost:3000/auth/nostr/verify \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": "abc123",
    "signedEvent": {
      ...
      "sig": "invalid_signature"
    }
  }'

# Expected Response:
# {
#   "error": "Invalid signature"
# }
```

## Integration Testing Script
```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test server URL
BASE_URL="http://localhost:3000/auth/nostr"

# Test public key (replace with a valid test key)
TEST_PUBKEY="npub1..."

echo "Starting Nostr Auth Middleware Tests..."

# Test 1: Challenge Request
echo -e "\n${GREEN}Testing Challenge Request...${NC}"
CHALLENGE_RESPONSE=$(curl -s -X POST "$BASE_URL/challenge" \
  -H "Content-Type: application/json" \
  -d "{\"pubkey\": \"$TEST_PUBKEY\"}")

CHALLENGE_ID=$(echo $CHALLENGE_RESPONSE | jq -r '.challengeId')

if [ ! -z "$CHALLENGE_ID" ]; then
  echo "✓ Challenge request successful"
else
  echo -e "${RED}✗ Challenge request failed${NC}"
  exit 1
fi

# Add more test cases here...

echo -e "\n${GREEN}All tests completed!${NC}"
```

Save this script as `test.sh` in your project root and make it executable:
```bash
chmod +x test.sh
./test.sh
```
