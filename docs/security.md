# Security Guide

## Key Management

### Private Key Handling

- **Never hardcode** private keys in source code
- Use environment variables or secure vaults for key storage
- Rotate keys periodically in production environments
- Use separate key pairs for different environments (dev, staging, production)

### JWT Secret Management

- Use a strong, unique secret for JWT signing (minimum 256 bits of entropy)
- Never expose the JWT secret in client-side code
- Rotate secrets periodically in production
- Use different secrets for development and production

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Authentication Flow

1. Client sends their Nostr public key
2. Server generates a challenge
3. Client signs the challenge with their private key (via NIP-07 extension)
4. Server verifies the signature against the public key
5. Server issues a JWT token on successful verification

## Token Security

### Best Practices

- Use short expiration times (15 minutes to 24 hours)
- Include only necessary claims (`pubkey`, `iat`, `exp`)
- Store tokens securely (httpOnly cookies or secure storage)
- Implement token refresh for long-lived sessions
- Clear tokens on logout

### Token Storage

| Method | Security | Use Case |
|--------|----------|----------|
| httpOnly cookie | High | Server-rendered apps |
| sessionStorage | Medium | Single-tab SPAs |
| localStorage | Lower | Persistent sessions |

## Browser Security

- The middleware detects browser Nostr extensions (nos2x, Alby) automatically
- Private keys never leave the extension — signing happens in the extension
- Session verification checks extension availability and public key match

## Rate Limiting

The middleware integrates with `express-rate-limit` for protection against brute-force attacks:

```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});

app.use('/auth', authLimiter);
```

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it through [GitHub's Security Advisory feature](https://github.com/HumanjavaEnterprises/nostr-auth-middleware/security/advisories/new). Do not open a public issue.
