export type SuiteSyncRelayConnectionLogEntry = {
    state: 'connected' | 'disconnected' | 'error';
    timestamp: number;
    url: string;
    errorMessage?: string;
};

export type SuiteSyncRelayConnection = {
    state: 'connected' | 'disconnected';
    url: string;
    lastDisconnectedTimestamp: number | null;
    log: SuiteSyncRelayConnectionLogEntry[];
};

export type SuiteSyncRelayConnectionEvent =
    | { type: 'add'; url: string }
    | { type: 'remove'; url: string }
    | { type: 'connect'; url: string }
    | { type: 'disconnect'; url: string }
    | { type: 'error'; url: string; errorMessage?: string };
