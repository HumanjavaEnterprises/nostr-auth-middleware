import React, { useState, useCallback } from 'react';

interface NostrLoginProps {
  onLoginSuccess?: (token: string, profile: any) => void;
  onLoginError?: (error: Error) => void;
  apiUrl?: string;
}

export const NostrLogin: React.FC<NostrLoginProps> = ({
  onLoginSuccess,
  onLoginError,
  apiUrl = 'http://localhost:3000',
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkNostrAvailability = async () => {
    if (typeof window.nostr === 'undefined') {
      throw new Error('Nostr extension not found. Please install a Nostr signer extension like nos2x or Alby.');
    }
  };

  const requestChallenge = async (pubkey: string) => {
    const response = await fetch(`${apiUrl}/auth/nostr/challenge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pubkey }),
    });

    if (!response.ok) {
      throw new Error('Failed to get challenge');
    }

    return response.json();
  };

  const signChallenge = async (challengeEvent: any) => {
    const signedEvent = await window.nostr.signEvent({
      kind: 22242,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['challenge', challengeEvent.id],
      ],
      content: `nostr:auth:${challengeEvent.id}`,
    });
    return signedEvent;
  };

  const verifySignature = async (challengeId: string, signedEvent: any) => {
    const response = await fetch(`${apiUrl}/auth/nostr/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        challengeId,
        signedEvent,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify signature');
    }

    return response.json();
  };

  const handleLogin = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if Nostr is available
      await checkNostrAvailability();

      // Get user's public key
      const pubkey = await window.nostr.getPublicKey();

      // Request challenge
      const { event: challengeEvent, challengeId } = await requestChallenge(pubkey);

      // Sign challenge
      const signedEvent = await signChallenge(challengeEvent);

      // Verify signature and get JWT token
      const { token, profile } = await verifySignature(challengeId, signedEvent);

      // Store token in localStorage
      localStorage.setItem('authToken', token);

      // Call success callback
      onLoginSuccess?.(token, profile);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to login with Nostr';
      setError(errorMessage);
      onLoginError?.(err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, onLoginSuccess, onLoginError]);

  return (
    <div className="nostr-login">
      <button
        onClick={handleLogin}
        disabled={loading}
        className="nostr-login-button"
      >
        {loading ? 'Connecting...' : 'Login with Nostr'}
      </button>
      {error && <div className="nostr-login-error">{error}</div>}

      <style jsx>{`
        .nostr-login {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .nostr-login-button {
          background: #7b3fe4;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .nostr-login-button:hover {
          background: #6032b0;
        }

        .nostr-login-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .nostr-login-error {
          color: #e44242;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

// Add TypeScript declarations for the Nostr window object
declare global {
  interface Window {
    nostr?: {
      getPublicKey: () => Promise<string>;
      signEvent: (event: any) => Promise<any>;
    };
  }
}
