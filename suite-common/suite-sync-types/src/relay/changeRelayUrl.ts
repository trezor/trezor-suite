export type ChangeRelayUrl = (params: { relayUrl: string | null }) => Promise<void>;

export type ChangeRelayUrlDep = {
    changeRelayUrl: ChangeRelayUrl;
};

export const selectChangeRelayUrlDep = (services: any): ChangeRelayUrlDep => ({
    changeRelayUrl: services.suiteSync.changeRelayUrl,
});
