export type ChangeRelayUrl = (params: { relayUrl: string | null }) => Promise<void>;

export type ChangeRelayUrlDep = {
    changeRelayUrl: ChangeRelayUrl;
};
