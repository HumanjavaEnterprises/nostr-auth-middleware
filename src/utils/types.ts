export interface NostrEvent {
    kind: number;
    created_at: number;
    tags: string[][];
    content: string;
    pubkey: string;
    id: string;  
    sig: string; 
}

export interface NostrChallenge {
    id: string;
    event: NostrEvent;
    expiresAt: number;
}
