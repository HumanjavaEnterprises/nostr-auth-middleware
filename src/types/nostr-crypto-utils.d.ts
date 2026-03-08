declare module 'nostr-crypto-utils' {
  export function generateKeyPair(): Promise<{ privateKey: string; publicKey: string }>;
  export function getPublicKey(privateKey: string): Promise<{ hex: string; bytes: Uint8Array }>;
  export function getPublicKeySync(privateKey: string): string;
  export function calculateEventId(event: any): string;
  export function createEvent(event: Partial<any>): any;
  export function signEvent(event: any, privateKey: string): Promise<any>;
  export function finalizeEvent(event: Partial<any>, privateKey: string): Promise<any>;
  export function verifySignature(event: any): Promise<boolean>;
}

declare module 'nostr-crypto-utils/nip46' {
  // ─── Types ──────────────────────────────────────────────────────────────────
  export interface BunkerURI {
    remotePubkey: string;
    relays: string[];
    secret?: string;
  }

  export interface BunkerValidationResult {
    isValid: boolean;
    error?: string;
    uri?: BunkerURI;
  }

  export interface Nip46Request {
    id: string;
    method: string;
    params: string[];
  }

  export interface Nip46Response {
    id: string;
    result?: string;
    error?: string;
  }

  export interface Nip46Session {
    clientSecretKey: string;
    clientPubkey: string;
    remotePubkey: string;
    conversationKey: Uint8Array;
  }

  export interface Nip46SessionInfo {
    clientPubkey: string;
    remotePubkey: string;
  }

  export interface Nip46SignerHandlers {
    getPublicKey: () => string | Promise<string>;
    signEvent: (eventJson: string) => string | Promise<string>;
    nip04Encrypt?: (pubkey: string, plaintext: string) => string | Promise<string>;
    nip04Decrypt?: (pubkey: string, ciphertext: string) => string | Promise<string>;
    nip44Encrypt?: (pubkey: string, plaintext: string) => string | Promise<string>;
    nip44Decrypt?: (pubkey: string, ciphertext: string) => string | Promise<string>;
    getRelays?: () => string | Promise<string>;
  }

  export interface Nip46HandleOptions {
    secret?: string;
    authenticatedClients?: Set<string>;
  }

  export interface Nip46HandleResult {
    response: Nip46Response;
    newlyAuthenticated?: string;
  }

  export interface Nip46UnwrapResult {
    request: Nip46Request;
    clientPubkey: string;
    conversationKey: Uint8Array;
  }

  export interface SignedNostrEvent {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig: string;
  }

  export enum Nip46Method {
    CONNECT = 'connect',
    PING = 'ping',
    GET_PUBLIC_KEY = 'get_public_key',
    SIGN_EVENT = 'sign_event',
    NIP04_ENCRYPT = 'nip04_encrypt',
    NIP04_DECRYPT = 'nip04_decrypt',
    NIP44_ENCRYPT = 'nip44_encrypt',
    NIP44_DECRYPT = 'nip44_decrypt',
    GET_RELAYS = 'get_relays',
  }

  // ─── Functions ────────────────────────────────────────────────────────────
  export function parseBunkerURI(uri: string): BunkerURI;
  export function createBunkerURI(remotePubkey: string, relays: string[], secret?: string): string;
  export function validateBunkerURI(uri: string): BunkerValidationResult;

  export function createSession(remotePubkey: string): Nip46Session;
  export function restoreSession(clientSecretKey: string, remotePubkey: string): Nip46Session;
  export function getSessionInfo(session: Nip46Session): Nip46SessionInfo;

  export function createRequest(method: string, params: string[], id?: string): Nip46Request;
  export function createResponse(id: string, result?: string, error?: string): Nip46Response;
  export function parsePayload(json: string): Nip46Request | Nip46Response;
  export function isRequest(payload: Nip46Request | Nip46Response): payload is Nip46Request;
  export function isResponse(payload: Nip46Request | Nip46Response): payload is Nip46Response;

  export function wrapEvent(payload: Nip46Request | Nip46Response, session: Nip46Session, recipientPubkey: string): Promise<SignedNostrEvent>;
  export function unwrapEvent(event: SignedNostrEvent, session: Nip46Session): Nip46Request | Nip46Response;

  export function connectRequest(remotePubkey: string, secret?: string, permissions?: string): Nip46Request;
  export function pingRequest(): Nip46Request;
  export function getPublicKeyRequest(): Nip46Request;
  export function signEventRequest(eventJson: string): Nip46Request;
  export function nip04EncryptRequest(thirdPartyPubkey: string, plaintext: string): Nip46Request;
  export function nip04DecryptRequest(thirdPartyPubkey: string, ciphertext: string): Nip46Request;
  export function nip44EncryptRequest(thirdPartyPubkey: string, plaintext: string): Nip46Request;
  export function nip44DecryptRequest(thirdPartyPubkey: string, ciphertext: string): Nip46Request;
  export function getRelaysRequest(): Nip46Request;

  export function createResponseFilter(clientPubkey: string, since?: number): { kinds: number[]; '#p': string[]; since?: number };
  export function createRequestFilter(signerPubkey: string, since?: number): { kinds: number[]; '#p': string[]; since?: number };

  export function unwrapRequest(event: SignedNostrEvent, signerSecretKey: string): Nip46UnwrapResult;
  export function wrapResponse(response: Nip46Response, signerSecretKey: string, signerPubkey: string, clientPubkey: string, conversationKey?: Uint8Array): Promise<SignedNostrEvent>;
  export function handleSignerRequest(request: Nip46Request, clientPubkey: string, handlers: Nip46SignerHandlers, opts?: Nip46HandleOptions): Promise<Nip46HandleResult>;
}
