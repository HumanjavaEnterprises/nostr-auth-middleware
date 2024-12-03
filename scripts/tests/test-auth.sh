#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Default values
ENV="development"
TEST_TYPE="all"
BASE_URL="http://localhost:3000/auth/nostr"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --env)
      ENV="$2"
      shift
      shift
      ;;
    --test)
      TEST_TYPE="$2"
      shift
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate environment
if [[ "$ENV" != "development" && "$ENV" != "production" ]]; then
  echo -e "${RED}Invalid environment. Must be 'development' or 'production'${NC}"
  exit 1
fi

# Set environment-specific variables
if [[ "$ENV" == "development" ]]; then
  DEPLOY_DIR="./local"
  LOG_DIR="./logs"
  BACKUP_DIR="./backups"
else
  DEPLOY_DIR="/opt/nostr-platform/auth"
  LOG_DIR="/var/log/nostr-platform/auth"
  BACKUP_DIR="/opt/backups/nostr-platform/auth"
fi

# Test Functions

test_directories() {
  echo -e "\n${YELLOW}Testing directory structure for $ENV environment...${NC}"
  
  dirs=($DEPLOY_DIR $LOG_DIR $BACKUP_DIR)
  for dir in "${dirs[@]}"; do
    if [[ -d "$dir" ]]; then
      echo -e "${GREEN}✓ Directory exists: $dir${NC}"
    else
      echo -e "${RED}✗ Directory missing: $dir${NC}"
      return 1
    fi
  done
}

test_permissions() {
  echo -e "\n${YELLOW}Testing permissions for $ENV environment...${NC}"
  
  if [[ "$ENV" == "production" ]]; then
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
      echo -e "${RED}Production tests must be run as root${NC}"
      return 1
    fi
    
    # Check service user/group
    if ! id nostr &>/dev/null; then
      echo -e "${RED}✗ Service user 'nostr' does not exist${NC}"
      return 1
    fi
  fi
  
  # Check directory permissions
  for dir in $DEPLOY_DIR $LOG_DIR $BACKUP_DIR; do
    if [[ -r "$dir" && -w "$dir" ]]; then
      echo -e "${GREEN}✓ Directory has correct permissions: $dir${NC}"
    else
      echo -e "${RED}✗ Directory has incorrect permissions: $dir${NC}"
      return 1
    fi
  done
}

test_config() {
  echo -e "\n${YELLOW}Testing configuration for $ENV environment...${NC}"
  
  # Test environment variables
  required_vars=("NODE_ENV" "DOMAIN" "SERVICE_NAME")
  for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
      echo -e "${RED}✗ Missing required environment variable: $var${NC}"
      return 1
    else
      echo -e "${GREEN}✓ Environment variable set: $var${NC}"
    fi
  done
  
  # Test config file
  if [[ -f "$DEPLOY_DIR/config.json" ]]; then
    echo -e "${GREEN}✓ Config file exists${NC}"
  else
    echo -e "${RED}✗ Config file missing${NC}"
    return 1
  fi
}

test_keys() {
  echo -e "\n${YELLOW}Testing key management for $ENV environment...${NC}"
  
  if [[ "$ENV" == "development" ]]; then
    # Test local key files
    if [[ -f "$DEPLOY_DIR/keys/private.key" && -f "$DEPLOY_DIR/keys/public.key" ]]; then
      echo -e "${GREEN}✓ Key files exist${NC}"
    else
      echo -e "${RED}✗ Key files missing${NC}"
      return 1
    fi
  else
    # Test Supabase key access
    if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_KEY" ]]; then
      echo -e "${RED}✗ Supabase credentials not configured${NC}"
      return 1
    fi
    echo -e "${GREEN}✓ Supabase credentials configured${NC}"
  fi
}

test_logging() {
  echo -e "\n${YELLOW}Testing logging for $ENV environment...${NC}"
  
  # Test log file creation
  test_log="$LOG_DIR/test.log"
  echo "Test log entry" > "$test_log"
  
  if [[ -f "$test_log" ]]; then
    echo -e "${GREEN}✓ Can create log files${NC}"
    rm "$test_log"
  else
    echo -e "${RED}✗ Cannot create log files${NC}"
    return 1
  fi
  
  # Test log rotation config
  if [[ "$ENV" == "production" ]]; then
    if [[ -f "/etc/logrotate.d/nostr-auth" ]]; then
      echo -e "${GREEN}✓ Log rotation configured${NC}"
    else
      echo -e "${RED}✗ Log rotation not configured${NC}"
      return 1
    fi
  fi
}

test_auth_flow() {
  echo -e "\n${YELLOW}Testing authentication flow...${NC}"
  
  # Generate test keypair
  TEST_PRIVKEY=$(openssl rand -hex 32)
  TEST_PUBKEY=$(node -e "
    const { getPublicKey } = require('nostr-tools');
    console.log(getPublicKey('$TEST_PRIVKEY'));
  ")
  
  # Test challenge request
  CHALLENGE_RESPONSE=$(curl -s -X POST "$BASE_URL/challenge" \
    -H "Content-Type: application/json" \
    -d "{\"pubkey\": \"$TEST_PUBKEY\"}")
  
  CHALLENGE_ID=$(echo $CHALLENGE_RESPONSE | jq -r '.challengeId')
  
  if [[ ! -z "$CHALLENGE_ID" && "$CHALLENGE_ID" != "null" ]]; then
    echo -e "${GREEN}✓ Challenge request successful${NC}"
  else
    echo -e "${RED}✗ Challenge request failed${NC}"
    return 1
  fi
  
  # More auth flow tests can be added here
}

# Run tests based on test type
case $TEST_TYPE in
  "directories")
    test_directories
    ;;
  "permissions")
    test_permissions
    ;;
  "config")
    test_config
    ;;
  "keys")
    test_keys
    ;;
  "logging")
    test_logging
    ;;
  "auth")
    test_auth_flow
    ;;
  "all")
    test_directories && \
    test_permissions && \
    test_config && \
    test_keys && \
    test_logging && \
    test_auth_flow
    ;;
  *)
    echo -e "${RED}Invalid test type: $TEST_TYPE${NC}"
    exit 1
    ;;
esac
