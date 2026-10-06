export type DisconnectAllRelays = () => Promise<void>;

export type DisconnectAllRelaysDep = {
    disconnectAllRelays: DisconnectAllRelays;
};

export const injectDisconnectAllRelays = (services: any): DisconnectAllRelaysDep => ({
    disconnectAllRelays: services.suiteSync.disconnectAllRelays,
});
