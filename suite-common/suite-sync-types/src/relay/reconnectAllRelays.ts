export type ReconnectAllRelaysParams = {
    /**
     * Confirmed Tor state from the Tor lifecycle event.
     * This must be passed explicitly because Redux Tor state can contain optimistic UI updates,
     * so reconnecting from Redux state could select the wrong relay URL during transitions.
     */
    isTorEnabled: boolean;
};

export type ReconnectAllRelays = (params: ReconnectAllRelaysParams) => Promise<void>;

export type ReconnectAllRelaysDep = {
    reconnectAllRelays: ReconnectAllRelays;
};

export const selectReconnectAllRelaysDep = (services: any): ReconnectAllRelaysDep => ({
    reconnectAllRelays: services.suiteSync.reconnectAllRelays,
});
