# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| CVSS v3.0 | Supported Versions                        |
| --------- | ---------------------------------------- |
| 9.0-10.0  | Releases within the last 6 months        |
| 4.0-8.9   | Most recent release                      |

## Reporting a Vulnerability

Please report security vulnerabilities to security@humanjavaenterprises.com.

The team will acknowledge your email within 48 hours, and will send a more detailed response within 72 hours indicating the next steps in handling your report.

After the initial reply to your report, the security team will endeavor to keep you informed of the progress towards a fix and full announcement, and may ask for additional information or guidance.

## Security Best Practices

When using this authentication middleware:

1. Always use HTTPS in production
2. Keep your JWT secret keys secure and rotate them regularly
3. Set appropriate token expiration times
4. Monitor for suspicious authentication patterns
5. Keep the middleware and its dependencies up to date

## Disclosure Policy

When the security team receives a security bug report, they will assign it to a primary handler. This person will coordinate the fix and release process.

## Comments on this Policy

If you have suggestions on how this process could be improved please submit a pull request.
