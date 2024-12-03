#!/bin/bash

# Test configuration
HOST="http://localhost:3002"
TEST_PUBKEY="npub1verfyxxx123testpubkeyxxx456789"

echo "🔍 Testing Nostr Auth Middleware (Test Mode)"
echo "============================================"
echo "Host: $HOST"
echo "Test pubkey: $TEST_PUBKEY"
echo

# Test 1: Health Check
echo -e "\n1️⃣  Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\nStatus: %{http_code}" "$HOST/health")
echo "Response:"
echo "$HEALTH_RESPONSE"

# Test 2: Request Challenge
echo -e "\n2️⃣  Requesting challenge..."
CHALLENGE_RESPONSE=$(curl -s -w "\nStatus: %{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "{\"pubkey\":\"$TEST_PUBKEY\"}" \
  "$HOST/auth/nostr/challenge")
echo "Response:"
echo "$CHALLENGE_RESPONSE"

CHALLENGE_ID=$(echo "$CHALLENGE_RESPONSE" | sed -n '1p' | jq -r '.challengeId // empty')
if [ -n "$CHALLENGE_ID" ]; then
  echo "Got challenge ID: $CHALLENGE_ID"
else
  echo "No challenge ID received"
fi

# Test 3: Verify Challenge (simulated in test mode)
echo -e "\n3️⃣  Verifying challenge..."
VERIFY_RESPONSE=$(curl -s -w "\nStatus: %{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"challengeId\":\"$CHALLENGE_ID\",
    \"signedEvent\":{
      \"pubkey\":\"$TEST_PUBKEY\",
      \"kind\":22242,
      \"tags\":[[\"challenge\",\"$CHALLENGE_ID\"]],
      \"content\":\"test-signature\",
      \"sig\":\"test-sig\"
    }
  }" \
  "$HOST/auth/nostr/verify")
echo "Response:"
echo "$VERIFY_RESPONSE"

# Test 4: Enrollment Request
echo -e "\n4️⃣  Testing enrollment request..."
ENROLL_RESPONSE=$(curl -s -w "\nStatus: %{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "{\"pubkey\":\"$TEST_PUBKEY\"}" \
  "$HOST/auth/nostr/enroll")
echo "Response:"
echo "$ENROLL_RESPONSE"

# Test 5: Get Profile
echo -e "\n5️⃣  Testing profile fetch..."
PROFILE_RESPONSE=$(curl -s -w "\nStatus: %{http_code}" \
  "$HOST/auth/nostr/profile/$TEST_PUBKEY")
echo "Response:"
echo "$PROFILE_RESPONSE"

echo -e "\n✅ Test suite completed!"
