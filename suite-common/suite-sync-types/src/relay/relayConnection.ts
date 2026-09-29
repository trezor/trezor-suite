export type SuiteSyncRelayConnectionError = {
    type: string;
    at: number;
};

export type SuiteSyncRelayConnection = {
    /** Relay URL without the owner-specific query. */
    url: string;
    isOpen: boolean;
    openedAt: number | null;
    closedAt: number | null;
    /** The last error, kept after a successful reconnect. */
    error: SuiteSyncRelayConnectionError | null;
};

export type SuiteSyncRelayConnectionsListener = (connections: SuiteSyncRelayConnection[]) => void;

/** @serviceContract */
export type SubscribeSuiteSyncRelayConnections = (
    listener: SuiteSyncRelayConnectionsListener,
) => void;

export type SubscribeSuiteSyncRelayConnectionsDep = {
    subscribeRelayConnections: SubscribeSuiteSyncRelayConnections;
};
