#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test server URL
BASE_URL="http://localhost:3000/auth/nostr"

# Test keys (replace these with actual test keys)
TEST_PUBKEY="npub1..."
TEST_PRIVKEY="nsec1..."  # Be careful with private keys, even test ones

echo -e "${GREEN}Starting Nostr Auth Middleware Tests...${NC}"

# Function to check if server is running
check_server() {
    curl -s "$BASE_URL/health" > /dev/null
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Server is not running${NC}"
        echo "Please start the server with: npm run dev"
        exit 1
    fi
}

# Test 1: Challenge Request
test_challenge() {
    echo -e "\n${GREEN}Test 1: Challenge Request${NC}"
    RESPONSE=$(curl -s -X POST "$BASE_URL/challenge" \
        -H "Content-Type: application/json" \
        -d "{\"pubkey\": \"$TEST_PUBKEY\"}")
    
    CHALLENGE_ID=$(echo $RESPONSE | jq -r '.challengeId')
    
    if [ ! -z "$CHALLENGE_ID" ] && [ "$CHALLENGE_ID" != "null" ]; then
        echo "✓ Challenge request successful"
        echo "Challenge ID: $CHALLENGE_ID"
        return 0
    else
        echo -e "${RED}✗ Challenge request failed${NC}"
        echo "Response: $RESPONSE"
        return 1
    fi
}

# Test 2: Invalid Public Key
test_invalid_pubkey() {
    echo -e "\n${GREEN}Test 2: Invalid Public Key${NC}"
    RESPONSE=$(curl -s -X POST "$BASE_URL/challenge" \
        -H "Content-Type: application/json" \
        -d '{"pubkey": "invalid_key"}')
    
    ERROR=$(echo $RESPONSE | jq -r '.error')
    
    if [ "$ERROR" = "Invalid public key format" ]; then
        echo "✓ Invalid public key test successful"
        return 0
    else
        echo -e "${RED}✗ Invalid public key test failed${NC}"
        echo "Response: $RESPONSE"
        return 1
    fi
}

# Test 3: Profile Fetch
test_profile_fetch() {
    echo -e "\n${GREEN}Test 3: Profile Fetch${NC}"
    RESPONSE=$(curl -s -X GET "$BASE_URL/profile/$TEST_PUBKEY")
    
    PUBKEY=$(echo $RESPONSE | jq -r '.pubkey')
    
    if [ "$PUBKEY" = "$TEST_PUBKEY" ]; then
        echo "✓ Profile fetch successful"
        return 0
    else
        echo -e "${RED}✗ Profile fetch failed${NC}"
        echo "Response: $RESPONSE"
        return 1
    fi
}

# Run all tests
main() {
    check_server
    
    # Array to store test results
    FAILED_TESTS=()
    
    # Run tests and collect results
    test_challenge || FAILED_TESTS+=("Challenge Request")
    test_invalid_pubkey || FAILED_TESTS+=("Invalid Public Key")
    test_profile_fetch || FAILED_TESTS+=("Profile Fetch")
    
    # Print summary
    echo -e "\n${GREEN}Test Summary:${NC}"
    if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
        echo -e "${GREEN}All tests passed!${NC}"
    else
        echo -e "${RED}Failed tests:${NC}"
        for test in "${FAILED_TESTS[@]}"; do
            echo "- $test"
        done
        exit 1
    fi
}

# Run main function
main
