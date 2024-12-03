import React from 'react';
import { NostrLogin } from './NostrLogin';

const App: React.FC = () => {
  const handleLoginSuccess = (token: string, profile: any) => {
    console.log('Login successful!');
    console.log('Token:', token);
    console.log('Profile:', profile);
    
    // You can now:
    // 1. Store the token in your app's state management (Redux, Context, etc.)
    // 2. Redirect to a protected route
    // 3. Fetch additional user data
  };

  const handleLoginError = (error: Error) => {
    console.error('Login failed:', error);
    // Handle error appropriately in your app
  };

  return (
    <div className="app">
      <h1>Nostr Auth Example</h1>
      <NostrLogin
        apiUrl="http://localhost:3000"
        onLoginSuccess={handleLoginSuccess}
        onLoginError={handleLoginError}
      />

      <style jsx>{`
        .app {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          text-align: center;
        }

        h1 {
          color: #333;
          margin-bottom: 2rem;
        }
      `}</style>
    </div>
  );
};

export default App;
