# Key Management and API Administration Guide

This guide outlines the key management system and API administration practices for the Nostr Auth Middleware. For a comprehensive understanding of how this fits into the larger architecture, please refer to our [Architecture Guide](architecture-guide.md).

## Table of Contents

1. [Key Types](#key-types)
2. [Environment-Specific Key Management](#environment-specific-key-management)
3. [Key Rotation](#key-rotation)
4. [API Administration](#api-administration)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)

## Architectural Context

The key management system is designed according to our core architectural principles:

1. **Service Isolation**: Key management is handled independently from application logic
2. **Security-First Design**: All key management code is open source and auditable
3. **Clear Boundaries**: Keys are managed only within this service's scope
4. **Transparent Security**: Implementation can be reviewed and verified by third parties

```plaintext
┌─────────────────┐
│   Client App    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Key Management │◄── You are here
│     System      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  App Platform   │
└─────────────────┘
```

## Key Types

### Server Keys
- **Private Key**: Used to sign server events and challenges
- **Public Key**: Shared with clients for server verification
- **Format**: 32-byte hex strings (64 characters)
- **Storage**: 
  - Development: Local files
  - Production: Supabase secure storage

### JWT Secret
- **Purpose**: Signs JWT tokens for authenticated sessions
- **Format**: Random 32-byte hex string
- **Rotation**: Every 30 days (configurable)

### API Keys
- **Purpose**: Authenticate service-to-service communication
- **Format**: `nostr_[environment]_[service]_[timestamp]`
- **Validation**: SHA-256 hash stored in configuration

## Environment-Specific Key Management

### Development Environment
```bash
# Key Storage Location
./local/keys/
  ├── private.key
  ├── public.key
  └── jwt.secret

# Generate new development keys
./scripts/generate-keys.sh --env development

# Validate keys
./scripts/validate-keys.sh --env development
```

### Production Environment
```bash
# Key Storage: Supabase Secure Storage
Table: service_keys
Columns:
  - key_id (UUID)
  - key_type (ENUM: 'private', 'public', 'jwt')
  - key_value (encrypted)
  - created_at (timestamp)
  - expires_at (timestamp)
  - is_active (boolean)

# Generate new production keys
sudo ./scripts/generate-keys.sh --env production

# Rotate production keys
sudo ./scripts/rotate-keys.sh --env production
```

## Key Rotation

### Automatic Key Rotation
The system automatically handles key rotation to maintain security:

1. **JWT Secret Rotation**
   ```bash
   # Scheduled rotation (via cron)
   0 0 1 * * /opt/nostr-platform/auth/scripts/rotate-jwt.sh

   # Manual rotation
   sudo ./scripts/rotate-jwt.sh --force
   ```

2. **Server Key Rotation**
   ```bash
   # Scheduled rotation (quarterly)
   0 0 1 */3 * /opt/nostr-platform/auth/scripts/rotate-server-keys.sh

   # Manual rotation
   sudo ./scripts/rotate-server-keys.sh --force
   ```

3. **API Key Rotation**
   ```bash
   # Generate new API key
   sudo ./scripts/generate-api-key.sh --service [service_name]

   # Revoke old API key
   sudo ./scripts/revoke-api-key.sh --key [key_id]
   ```

### Rotation Process
1. Generate new keys
2. Update active keys in configuration
3. Maintain old keys for grace period
4. Remove expired keys
5. Log rotation event

## API Administration

### Managing API Access

1. **Register New Service**
   ```bash
   # Register service
   sudo ./scripts/register-service.sh \
     --name "service-name" \
     --domain "service.domain.com" \
     --env production
   ```

2. **Generate API Key**
   ```bash
   # Generate and assign key
   sudo ./scripts/generate-api-key.sh \
     --service "service-name" \
     --expiry 90
   ```

3. **Monitor API Usage**
   ```bash
   # View API metrics
   ./scripts/view-metrics.sh --service "service-name"
   
   # View access logs
   sudo tail -f /var/log/nostr-platform/auth/api-access.log
   ```

### Rate Limiting and Quotas

```javascript
// Default limits per service
{
  "rateLimit": {
    "window": 3600,    // 1 hour
    "maxRequests": 1000
  },
  "quotas": {
    "daily": 10000,
    "monthly": 250000
  }
}
```

## Security Best Practices

1. **Key Storage**
   - Never store keys in version control
   - Use environment variables for local development
   - Use secure key storage (Supabase) in production
   - Implement proper access controls
   - Follow service isolation principles

2. **Access Control**
   - Limit key access to authorized personnel
   - Use role-based access control
   - Log all key access attempts
   - Regular access audits
   - Maintain clear security boundaries

3. **Monitoring**
   - Monitor failed authentication attempts
   - Alert on suspicious activity
   - Regular security audits
   - Automated vulnerability scanning
   - Independent security reviews

4. **Backup and Recovery**
   ```bash
   # Backup keys
   sudo ./scripts/backup-keys.sh --env production
   
   # Verify backup
   sudo ./scripts/verify-backup.sh --latest
   
   # Restore from backup
   sudo ./scripts/restore-keys.sh --backup [backup_id]
   ```

## Troubleshooting

### Common Issues

1. **Key Validation Failures**
   ```bash
   # Check key integrity
   ./scripts/validate-keys.sh --env [environment]
   
   # View key status
   ./scripts/key-status.sh --env [environment]
   ```

2. **API Authentication Issues**
   ```bash
   # Test API key
   ./scripts/test-api-key.sh --key [api_key]
   
   # View recent auth failures
   sudo tail -f /var/log/nostr-platform/auth/auth-failures.log
   ```

3. **Key Rotation Problems**
   ```bash
   # Check rotation status
   ./scripts/rotation-status.sh
   
   # Force sync keys
   sudo ./scripts/sync-keys.sh --force
   ```

### Emergency Procedures

1. **Key Compromise Response**
   ```bash
   # Initiate emergency key rotation
   sudo ./scripts/emergency-rotate.sh --all
   
   # Revoke compromised keys
   sudo ./scripts/revoke-keys.sh --compromised
   ```

2. **Service Recovery**
   ```bash
   # Restore service with new keys
   sudo ./scripts/service-recovery.sh --service [service_name]
   ```

For additional assistance or emergency support, contact the security team at security@yourdomain.com.
