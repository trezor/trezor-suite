export type ReconnectAllParams = {
    /**
     * Confirmed Tor state from the Tor lifecycle event.
     * This must be passed explicitly because Redux Tor state can contain optimistic UI updates,
     * so reconnecting from Redux state could select the wrong relay URL during transitions.
     */
    isTorEnabled: boolean;
};

export type ReconnectAll = (params: ReconnectAllParams) => Promise<void>;

export type ReconnectAllDep = {
    reconnectAll: ReconnectAll;
};

export const selectReconnectAllDep = (services: any): ReconnectAllDep => ({
    reconnectAll: services.suiteSync.reconnectAll,
});
