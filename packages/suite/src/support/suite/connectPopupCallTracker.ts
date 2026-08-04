/**
 * Tracks per-connection ownership of desktop connect-popup calls so that a cancel can be scoped
 * to the connection that issued it — one client must not be able to cancel another's call.
 *
 * A call is registered while it waits in the popup queue; the "active" call is the one currently
 * being processed. This is framework-agnostic and side-effect-free so it can be unit-tested in
 * isolation; the async orchestration (queue, dispatch, IPC) stays in useConnectPopupDesktop.
 *
 * `connectionId` is undefined only for callers without a per-connection transport
 * (web/deeplink/walletconnect); those are single-client and cancel unconditionally.
 */
export type ConnectPopupCallEntry = { canceled: boolean };

export const createConnectPopupCallTracker = () => {
    const queuedByConnection = new Map<string, Set<ConnectPopupCallEntry>>();
    let activeConnectionId: string | undefined;

    return {
        // Register a received call while it waits in the queue.
        register(connectionId: string | undefined): ConnectPopupCallEntry {
            const entry: ConnectPopupCallEntry = { canceled: false };
            if (connectionId !== undefined) {
                const set = queuedByConnection.get(connectionId) ?? new Set();
                set.add(entry);
                queuedByConnection.set(connectionId, set);
            }

            return entry;
        },

        // Forget a call once it has settled.
        unregister(connectionId: string | undefined, entry: ConnectPopupCallEntry) {
            if (connectionId === undefined) return;
            const set = queuedByConnection.get(connectionId);
            set?.delete(entry);
            if (set?.size === 0) queuedByConnection.delete(connectionId);
        },

        // Mark the call that just left the queue as the active one.
        setActive(connectionId: string | undefined) {
            activeConnectionId = connectionId;
        },

        // Clear the active call, but only if it is still the given connection's.
        clearActive(connectionId: string | undefined) {
            if (activeConnectionId === connectionId) activeConnectionId = undefined;
        },

        // Flag a connection's queued calls so they self-reject instead of opening a popup.
        cancelQueued(connectionId: string | undefined) {
            if (connectionId === undefined) return;
            queuedByConnection.get(connectionId)?.forEach(entry => {
                entry.canceled = true;
            });
        },

        // Whether a cancel from `connectionId` may act on the active call.
        ownsActiveCall(connectionId: string | undefined): boolean {
            return connectionId === undefined || connectionId === activeConnectionId;
        },
    };
};

export type ConnectPopupCallTracker = ReturnType<typeof createConnectPopupCallTracker>;
