#!/bin/bash

# Service Configuration
export SERVICE_NAME="${SERVICE_NAME:-nostr-auth-middleware}"
export SERVICE_DIR="${SERVICE_DIR:-/opt/nostr-platform/auth}"
export SERVICE_USER="${SERVICE_USER:-nostr}"
export SERVICE_GROUP="${SERVICE_GROUP:-nostr}"

# PM2 Configuration
export PM2_NAME="${PM2_NAME:-$SERVICE_NAME}"
export PM2_SCRIPT="${PM2_SCRIPT:-ecosystem.config.cjs}"

# Environment Configuration
export NODE_ENV="${NODE_ENV:-development}"
export TEST_MODE="${TEST_MODE:-false}"

# Development vs Production paths
if [ "$NODE_ENV" = "development" ]; then
    # Use local paths for development
    export LOG_DIR="${LOG_DIR:-./logs}"
    export BACKUP_DIR="${BACKUP_DIR:-./backups}"
    export DEPLOY_DIR="${DEPLOY_DIR:-.}"
else
    # Use system paths for production
    export LOG_DIR="${LOG_DIR:-/var/log/nostr-platform/auth}"
    export BACKUP_DIR="${BACKUP_DIR:-/opt/backups/nostr-platform/auth}"
    export DEPLOY_DIR="${DEPLOY_DIR:-/opt/nostr-platform/auth}"
fi

# Backup Configuration
export MAX_BACKUPS="${MAX_BACKUPS:-6}"
export MAX_DAYS="${MAX_DAYS:-60}"

# Log Configuration
export LOG_RETENTION_DAYS="${LOG_RETENTION_DAYS:-15}"

# Colors for output
export GREEN='\033[0;32m'
export RED='\033[0;31m'
export YELLOW='\033[1;33m'
export NC='\033[0m'

# Function to log messages
log() {
    local level=$1
    local message=$2
    local color=$NC
    
    case $level in
        "INFO") color=$GREEN ;;
        "WARN") color=$YELLOW ;;
        "ERROR") color=$RED ;;
    esac
    
    echo -e "${color}[$level] $message${NC}"
}

# Function to check if running as root
check_root() {
    if [ "$NODE_ENV" = "production" ] && [ "$(id -u)" != "0" ]; then
        log "ERROR" "Production mode requires root privileges"
        exit 1
    fi
}

# Function to check required commands
check_requirements() {
    local requirements=("node" "npm" "pm2")
    local missing=()
    
    for cmd in "${requirements[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            missing+=("$cmd")
        fi
    done
    
    if [ ${#missing[@]} -ne 0 ]; then
        log "ERROR" "Missing required commands: ${missing[*]}"
        log "ERROR" "Please install the missing requirements and try again"
        exit 1
    fi
}

# Function to create directory with proper permissions
create_directory() {
    local dir=$1
    local skip_permissions=$2

    if [ ! -d "$dir" ]; then
        log "INFO" "Creating directory: $dir"
        if [ "$NODE_ENV" = "production" ]; then
            sudo mkdir -p "$dir" || {
                log "ERROR" "Failed to create directory: $dir"
                return 1
            }
            if [ "$skip_permissions" != "true" ]; then
                sudo chown -R "$SERVICE_USER:$SERVICE_GROUP" "$dir" || {
                    log "ERROR" "Failed to set permissions on: $dir"
                    return 1
                }
            fi
        else
            mkdir -p "$dir" || {
                log "ERROR" "Failed to create directory: $dir"
                return 1
            }
        fi
    fi
    return 0
}

# Function to ensure directories exist with correct permissions
ensure_directories() {
    local success=true

    # Always create log directory
    create_directory "$LOG_DIR" || success=false

    # Only create production directories if in production mode
    if [ "$NODE_ENV" = "production" ]; then
        create_directory "$DEPLOY_DIR" || success=false
        create_directory "$BACKUP_DIR" || success=false
    fi

    if [ "$success" = false ]; then
        if [ "$NODE_ENV" = "production" ]; then
            log "ERROR" "Failed to create required directories. Please check permissions and try again."
            exit 1
        else
            log "WARN" "Some directories could not be created. Continuing in development mode..."
        fi
    fi
}

# Export functions
export -f log
export -f check_requirements
export -f create_directory
export -f ensure_directories
export -f check_root
