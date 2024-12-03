# React Nostr Authentication Example

This example demonstrates how to integrate Nostr authentication into a React application using the nostr-auth-middleware.

## Features

- 🔑 Nostr authentication flow
- 💅 Styled components for a polished look
- 🔄 Loading and error states
- 📝 TypeScript support
- 🎨 Customizable styling

## Prerequisites

1. A Nostr signer extension (like nos2x or Alby) installed in your browser
2. The nostr-auth-middleware server running locally or deployed
3. Node.js and npm installed

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Update the `apiUrl` in `App.tsx` to point to your nostr-auth-middleware server:
```typescript
<NostrLogin
  apiUrl="http://your-api-url"
  onLoginSuccess={handleLoginSuccess}
  onLoginError={handleLoginError}
/>
```

3. Start the development server:
```bash
npm start
```

## Component Usage

The `NostrLogin` component accepts the following props:

```typescript
interface NostrLoginProps {
  // Called when login is successful with the JWT token and user profile
  onLoginSuccess?: (token: string, profile: any) => void;
  
  // Called when an error occurs during login
  onLoginError?: (error: Error) => void;
  
  // URL of your nostr-auth-middleware server
  apiUrl?: string;
}
```

### Basic Usage

```typescript
import { NostrLogin } from './NostrLogin';

function App() {
  return (
    <NostrLogin
      apiUrl="http://localhost:3000"
      onLoginSuccess={(token, profile) => {
        console.log('Logged in!', { token, profile });
      }}
    />
  );
}
```

### With Error Handling

```typescript
import { NostrLogin } from './NostrLogin';

function App() {
  const handleSuccess = (token: string, profile: any) => {
    // Store token in your app's state management
    localStorage.setItem('authToken', token);
    
    // Update user context/state
    setUser(profile);
    
    // Redirect to dashboard
    navigate('/dashboard');
  };

  const handleError = (error: Error) => {
    // Show error notification
    toast.error(error.message);
  };

  return (
    <NostrLogin
      apiUrl="http://localhost:3000"
      onLoginSuccess={handleSuccess}
      onLoginError={handleError}
    />
  );
}
```

## Styling

The component comes with default styling using CSS-in-JS. You can customize the appearance by:

1. Overriding the CSS classes:
```css
.nostr-login-button {
  /* your custom styles */
}
```

2. Creating your own component using the login logic:
```typescript
import { useNostrLogin } from './useNostrLogin'; // Extract the logic to a custom hook

function CustomNostrLogin() {
  const { login, loading, error } = useNostrLogin();
  
  return (
    <YourCustomButton
      onClick={login}
      loading={loading}
    />
  );
}
```

## Security Considerations

1. Always use HTTPS in production
2. Store the JWT token securely
3. Implement token refresh logic
4. Clear tokens on logout
5. Validate server responses

## Error Handling

The component handles several common error cases:

- No Nostr extension installed
- User rejected the signature request
- Network errors
- Invalid responses from the server

## Contributing

Feel free to submit issues and enhancement requests!
