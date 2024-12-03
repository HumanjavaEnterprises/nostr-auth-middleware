# Troubleshooting Guide

This guide helps you diagnose and fix common issues when using the Nostr Auth Middleware.

## Table of Contents

1. [Common Issues](#common-issues)
2. [Environment-Specific Issues](#environment-specific-issues)
3. [Error Messages](#error-messages)
4. [Configuration Problems](#configuration-problems)
5. [Integration Issues](#integration-issues)
6. [Performance Optimization](#performance-optimization)
7. [Debug Mode](#debug-mode)

## Common Issues

### No Nostr Extension Found

**Symptom:**
- "Nostr extension not found" error
- Login button doesn't respond

**Solution:**
1. Check if a Nostr extension is installed (nos2x, Alby, etc.)
2. Verify the extension is enabled
3. Try refreshing the page
4. Check console for specific errors

### Invalid Signature

**Symptom:**
- "Invalid signature" error after signing
- Authentication fails after challenge

**Solution:**
1. Verify the private key configuration:
   ```typescript
   const nostrAuth = createNostrAuth({
     privateKey: process.env.SERVER_PRIVATE_KEY // Must be hex format
   });
   ```
2. Check event creation:
   ```typescript
   // Event should match this format
   const event = {
     kind: 22242,
     created_at: Math.floor(Date.now() / 1000),
     tags: [['challenge', challengeId]],
     content: `nostr:auth:${challengeId}`
   };
   ```

## Environment-Specific Issues

### Development Mode Issues

#### Hot Reload Not Working
**Symptom:**
- Changes not reflecting immediately
- Need to manually restart server

**Solution:**
1. Check `NODE_ENV` is set to 'development'
2. Verify TypeScript compilation:
   ```bash
   # Rebuild TypeScript
   npm run build
   
   # Check for compilation errors
   npm run build -- --noEmit
   ```
3. Check file permissions in development directories

#### Local Directory Issues
**Symptom:**
- "Directory not found" errors
- Permission denied in local directories

**Solution:**
1. Check local directory structure:
   ```bash
   # Create required directories
   mkdir -p logs backups
   
   # Check permissions
   ls -la logs backups
   ```
2. Verify current user has write permissions

#### Test Mode Configuration
**Symptom:**
- Test features not working
- Database connection issues in test mode

**Solution:**
1. Verify test mode is enabled:
   ```bash
   # .env
   TEST_MODE=true
   NODE_ENV=development
   ```
2. Check in-memory database configuration
3. Verify test data is being loaded

### Production Mode Issues

#### System Directory Permissions
**Symptom:**
- "EACCES: permission denied" errors
- Cannot write to log files
- Backup creation fails

**Solution:**
1. Check service user and group:
   ```bash
   # Show directory ownership
   ls -l /opt/nostr-platform/auth
   ls -l /var/log/nostr-platform/auth
   
   # Fix permissions if needed
   sudo chown -R nostr:nostr /opt/nostr-platform/auth
   sudo chmod 755 /opt/nostr-platform/auth
   ```

2. Verify process is running as correct user:
   ```bash
   # Check process user
   ps aux | grep nostr-auth
   
   # Start with correct user
   sudo -u nostr ./scripts/startup.sh
   ```

#### Service Management
**Symptom:**
- Service not starting
- PM2 process issues
- Unexpected shutdowns

**Solution:**
1. Check PM2 process status:
   ```bash
   pm2 list
   pm2 show nostr-auth-middleware
   ```

2. Verify PM2 logs:
   ```bash
   pm2 logs nostr-auth-middleware
   ```

3. Check system logs:
   ```bash
   sudo journalctl -u nostr-auth-middleware
   ```

#### Log Management
**Symptom:**
- Logs not rotating
- Disk space issues
- Missing log files

**Solution:**
1. Check log rotation configuration:
   ```bash
   # View log files
   ls -l /var/log/nostr-platform/auth/
   
   # Check disk space
   df -h /var/log
   
   # Manually rotate logs if needed
   ./scripts/shutdown.sh  # Includes log rotation
   ```

2. Verify log permissions:
   ```bash
   # Fix log directory permissions
   sudo chown -R nostr:nostr /var/log/nostr-platform/auth
   sudo chmod 755 /var/log/nostr-platform/auth
   ```

#### Backup Management
**Symptom:**
- Backups not created
- Old backups not cleaned
- Backup process fails

**Solution:**
1. Check backup directory:
   ```bash
   ls -l /opt/backups/nostr-platform/auth/
   ```

2. Verify backup rotation:
   ```bash
   # Check old backups
   find /opt/backups/nostr-platform/auth/ -type f -mtime +60
   
   # Manually clean old backups
   find /opt/backups/nostr-platform/auth/ -type f -mtime +60 -delete
   ```

3. Test backup creation:
   ```bash
   # Create manual backup
   ./scripts/deploy.sh --backup-only
   ```

## Error Messages

### Challenge Expired

**Error:**
```
Challenge expired or not found
```

**Fix:**
1. Check `eventTimeoutMs` in configuration
2. Ensure client clock is synchronized
3. Verify challenge handling:
   ```typescript
   const { event: challengeEvent, challengeId } = await requestChallenge(pubkey);
   // Sign immediately after receiving
   const signedEvent = await window.nostr.signEvent(event);
   ```

### Database Connection

**Error:**
```
Failed to connect to database
```

**Fix:**
1. Verify Supabase credentials
2. Check network connectivity
3. Ensure proper configuration:
   ```typescript
   const nostrAuth = createNostrAuth({
     supabaseUrl: process.env.SUPABASE_URL,
     supabaseKey: process.env.SUPABASE_KEY
   });
   ```

## Configuration Problems

### Environment Variables

**Problem:**
Missing or incorrect environment variables

**Solution:**
1. Create `.env` file:
   ```bash
   SUPABASE_URL=your_url
   SUPABASE_KEY=your_key
   SERVER_PRIVATE_KEY=your_key
   JWT_SECRET=your_secret
   ```

2. Load variables:
   ```typescript
   import dotenv from 'dotenv';
   dotenv.config();
   ```

### CORS Issues

**Problem:**
Cross-origin requests failing

**Solution:**
1. Configure CORS properly:
   ```typescript
   const nostrAuth = createNostrAuth({
     corsOrigins: ['https://your-frontend.com']
   });
   ```

2. For development:
   ```typescript
   const nostrAuth = createNostrAuth({
     corsOrigins: '*' // Only in development!
   });
   ```

## Integration Issues

### React Integration

**Problem:**
Component not rendering or updating

**Solution:**
1. Check imports:
   ```typescript
   import { NostrLogin } from '@maiqr/nostr-auth-enroll/react';
   ```

2. Verify props:
   ```typescript
   <NostrLogin
     apiUrl="http://localhost:3000"
     onLoginSuccess={(token, profile) => {
       // Handle success
     }}
     onLoginError={(error) => {
       console.error('Login failed:', error);
     }}
   />
   ```

### API Integration

**Problem:**
API calls failing after authentication

**Solution:**
1. Check token handling:
   ```typescript
   // Create axios instance
   const api = axios.create({
     baseURL: '/api',
     headers: {
       'Authorization': `Bearer ${getToken()}`
     }
   });

   // Add interceptor for token refresh
   api.interceptors.response.use(
     response => response,
     async error => {
       if (error.response.status === 401) {
         // Handle token refresh
       }
       return Promise.reject(error);
     }
   );
   ```

## Performance Optimization

### Slow Authentication

**Problem:**
Authentication taking too long

**Solution:**
1. Optimize challenge timeout:
   ```typescript
   const nostrAuth = createNostrAuth({
     eventTimeoutMs: 30000 // 30 seconds
   });
   ```

2. Use connection pooling:
   ```typescript
   const pool = new Pool({
     max: 20,
     idleTimeoutMillis: 30000
   });
   ```

### Memory Usage

**Problem:**
High memory usage

**Solution:**
1. Clean up challenges:
   ```typescript
   // Automatically remove expired challenges
   setInterval(() => {
     cleanupChallenges();
   }, 60000);
   ```

2. Implement caching:
   ```typescript
   const cache = new Map();
   
   function getCachedProfile(pubkey) {
     if (cache.has(pubkey)) {
       return cache.get(pubkey);
     }
     // Fetch and cache
   }
   ```

## Debug Mode

Enable debug mode for detailed logging:

```typescript
const nostrAuth = createNostrAuth({
  debug: true,
  logger: {
    level: 'debug',
    format: 'json'
  }
});
```

View logs:
```bash
# Production
pm2 logs nostr-auth-middleware

# Development
npm run dev
```

## Support

If you're still experiencing issues:

1. Check our [GitHub Issues](https://github.com/your-repo/issues)
2. Join our [Discord community](https://discord.gg/your-server)
3. Create a minimal reproduction of the issue
4. Include relevant logs and error messages

## Contributing

Found a bug or want to contribute a fix? See our [Contributing Guide](CONTRIBUTING.md).
