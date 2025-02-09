# Session Management in Nostr Auth Middleware

This document outlines the session management capabilities of the Nostr Auth Middleware, including verification, caching, and development tools.

## Overview

Session management in Nostr applications requires careful handling of user authentication state and profile information. The middleware provides tools for:
- Session verification
- Profile caching
- Development logging
- Graceful error handling

## Session Verification

### Browser Environment

In browser environments, session verification works by checking if:
1. The Nostr extension is still available
2. The user's public key matches the stored session
3. The connection is active and valid

```javascript
const auth = new NostrAuthMiddleware();

// Verify session
const isValid = await auth.verifySession(userPubkey);
if (!isValid) {
  // Handle invalid session
  await auth.logout();
  redirectToLogin();
}
```

### Server Environment

In server environments, session verification:
1. Validates the pubkey format
2. Checks token expiration
3. Verifies signature if applicable

```javascript
const auth = new NostrAuthMiddleware();

app.use(async (req, res, next) => {
  const pubkey = req.session.pubkey;
  if (!(await auth.verifySession(pubkey))) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  next();
});
```

## Profile Caching

The middleware includes profile caching to improve performance:

### Cache Operations
```javascript
// Fetch profile (uses cache if available)
const profile = await auth.fetchNostrProfile(pubkey);

// Manually clear cache
auth.clearProfileCache(pubkey);
```

### Cache Configuration
- Default cache duration: 1 hour
- Automatic cache invalidation
- Cache clearing on logout
- Error handling for failed cache operations

## Development Mode

When `import.meta.env.MODE === 'development'`, the middleware provides detailed logging:

### Profile Operations
```javascript
🔵 Cached Profile: {
  name: "user123",
  about: "Nostr enthusiast",
  picture: "https://..."
}

🟢 Fresh Profile: {
  profile: { /* profile data */ },
  event: { /* raw nostr event */ }
}
```

### Cache Operations
```javascript
🔵 Profile Cache Hit: {
  pubkey: "npub...",
  cacheAge: "30 minutes"
}

🔴 Profile Cache Expired: {
  pubkey: "npub...",
  cacheAge: "65 minutes"
}

💾 Profile Cached: {
  pubkey: "npub...",
  profile: { /* profile data */ }
}

🗑️ Profile Cache Cleared: {
  pubkey: "npub..."
}
```

## Best Practices

1. **Regular Verification**
   - Verify sessions on sensitive operations
   - Implement periodic verification for long-lived sessions
   - Handle verification failures gracefully

2. **Cache Management**
   - Use appropriate cache duration for your use case
   - Clear cache on profile updates
   - Handle cache misses gracefully

3. **Error Handling**
   - Always handle verification errors
   - Provide clear user feedback
   - Implement proper fallback mechanisms

4. **Development**
   - Use development mode logs for debugging
   - Monitor cache performance
   - Test session edge cases

## Security Considerations

1. **Session Storage**
   - Use secure storage mechanisms
   - Clear sessions on logout
   - Implement proper session expiration

2. **Profile Data**
   - Validate cached profile data
   - Handle missing or corrupt cache
   - Implement proper access controls

3. **Error Cases**
   - Handle extension disconnection
   - Manage multiple device sessions
   - Protect against session hijacking

## Example Implementation

```javascript
class AuthManager {
  constructor() {
    this.auth = new NostrAuthMiddleware();
  }

  async verifyUserSession(pubkey) {
    try {
      const isValid = await this.auth.verifySession(pubkey);
      if (!isValid) {
        await this.handleInvalidSession();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Session verification failed:', error);
      return false;
    }
  }

  async handleInvalidSession() {
    await this.auth.logout();
    this.auth.clearProfileCache(pubkey);
    // Additional cleanup...
  }
}
```

## Troubleshooting

Common issues and solutions:

1. **Invalid Session**
   - Check Nostr extension connection
   - Verify pubkey format
   - Check token expiration

2. **Cache Issues**
   - Clear corrupted cache
   - Check storage limits
   - Verify cache timing

3. **Development Mode**
   - Enable development mode for detailed logs
   - Check browser console
   - Monitor cache operations
