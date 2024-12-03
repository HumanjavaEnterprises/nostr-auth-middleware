# Migration Guide: Adding Nostr Authentication to Your Application

This guide will help you migrate your existing application to use Nostr authentication. We'll cover different scenarios and provide step-by-step instructions.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Migration](#backend-migration)
3. [Frontend Migration](#frontend-migration)
4. [Database Integration](#database-integration)
5. [Testing the Migration](#testing-the-migration)
6. [Rollback Plan](#rollback-plan)

## Prerequisites

Before starting the migration:

1. Ensure you have:
   - Node.js >= 16.0.0
   - A Supabase account and project
   - Your existing authentication system documented

2. Install the package:
   ```bash
   npm install @maiqr/nostr-auth-enroll
   ```

## Backend Migration

### 1. Initial Setup

```typescript
import { createNostrAuth } from '@maiqr/nostr-auth-enroll';
import express from 'express';

const app = express();

// Initialize the middleware
const nostrAuth = createNostrAuth({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
  privateKey: process.env.SERVER_PRIVATE_KEY
});

// Add the routes
app.use('/auth/nostr', nostrAuth.router);
```

### 2. Parallel Authentication Systems

Run both systems in parallel during migration:

```typescript
// Existing auth middleware
app.use('/auth', existingAuthRouter);

// Nostr auth middleware
app.use('/auth/nostr', nostrAuth.router);

// Protected routes can accept either token
app.use('/api/*', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Try Nostr token first
    const nostrVerified = nostrAuth.verifyToken(token);
    if (nostrVerified) {
      req.user = nostrVerified;
      return next();
    }
  } catch (e) {
    // If not a Nostr token, try existing auth
    try {
      const existingVerified = existingAuth.verifyToken(token);
      if (existingVerified) {
        req.user = existingVerified;
        return next();
      }
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
});
```

## Frontend Migration

### 1. Add Nostr Login Component

```typescript
import { NostrLogin } from '@maiqr/nostr-auth-enroll/react';

function LoginPage() {
  return (
    <div>
      {/* Keep existing login */}
      <ExistingLoginForm />
      
      {/* Add Nostr login */}
      <NostrLogin
        apiUrl="https://your-api.com"
        onLoginSuccess={(token, profile) => {
          // Store token in your existing auth management
          auth.setToken(token);
          auth.setUser(profile);
        }}
      />
    </div>
  );
}
```

### 2. Update Auth Management

```typescript
class AuthManager {
  private token: string | null = null;
  private user: any = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  getUser() {
    return this.user;
  }

  async logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    // Add any additional cleanup
  }

  // Update API client to use token
  api = axios.create({
    baseURL: '/api',
    headers: {
      'Authorization': `Bearer ${this.token}`
    }
  });
}
```

## Database Integration

### 1. Create Required Tables

```sql
-- In your existing database
CREATE TABLE nostr_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pubkey TEXT UNIQUE NOT NULL,
  name TEXT,
  about TEXT,
  picture TEXT,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link to existing users (optional)
CREATE TABLE user_nostr_links (
  user_id UUID REFERENCES users(id),
  nostr_pubkey TEXT REFERENCES nostr_profiles(pubkey),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, nostr_pubkey)
);
```

### 2. Data Migration (if needed)

```typescript
async function migrateUserToNostr(userId: string, nostrPubkey: string) {
  await db.transaction(async (trx) => {
    // Link existing user to Nostr profile
    await trx('user_nostr_links').insert({
      user_id: userId,
      nostr_pubkey: nostrPubkey
    });
    
    // Copy relevant user data
    const user = await trx('users').where({ id: userId }).first();
    await trx('nostr_profiles').insert({
      pubkey: nostrPubkey,
      name: user.name,
      picture: user.avatar_url
    });
  });
}
```

## Testing the Migration

1. **Unit Tests**
   ```typescript
   describe('Authentication', () => {
     it('should accept existing auth token', async () => {
       const token = await loginWithExisting();
       const res = await api.get('/protected', {
         headers: { Authorization: `Bearer ${token}` }
       });
       expect(res.status).toBe(200);
     });

     it('should accept nostr auth token', async () => {
       const token = await loginWithNostr();
       const res = await api.get('/protected', {
         headers: { Authorization: `Bearer ${token}` }
       });
       expect(res.status).toBe(200);
     });
   });
   ```

2. **Integration Tests**
   - Test both auth systems in parallel
   - Verify token persistence
   - Check profile synchronization

3. **User Acceptance Testing**
   - Test with real Nostr extensions
   - Verify UX flows
   - Check error handling

## Rollback Plan

1. **Quick Rollback**
   ```typescript
   // Disable Nostr routes
   app.use('/auth/nostr', (req, res) => {
     res.status(503).json({ error: 'Temporarily unavailable' });
   });
   ```

2. **Database Rollback**
   ```sql
   -- Keep the tables but disable new entries
   REVOKE INSERT, UPDATE ON nostr_profiles FROM api_role;
   REVOKE INSERT, UPDATE ON user_nostr_links FROM api_role;
   ```

3. **Client Rollback**
   ```typescript
   const ENABLE_NOSTR = false;

   function LoginPage() {
     return (
       <div>
         <ExistingLoginForm />
         {ENABLE_NOSTR && <NostrLogin />}
       </div>
     );
   }
   ```

## Best Practices

1. **Gradual Rollout**
   - Start with a small % of users
   - Monitor error rates
   - Gather user feedback

2. **Data Integrity**
   - Keep existing user data
   - Maintain backup of auth tables
   - Log all auth attempts

3. **Security**
   - Review token validation
   - Check CORS settings
   - Monitor failed attempts

4. **User Communication**
   - Announce the new login option
   - Provide help documentation
   - Offer support channels
