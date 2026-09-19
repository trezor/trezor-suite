import type { NetworkSymbol } from './networkSymbol';

export type NetworkConfig = {
    readonly name: string;
};

export type NetworkConfigState = {
    readonly networks: Readonly<Record<NetworkSymbol, NetworkConfig>> | null;
};

/** @serviceContract */
export type NetworkConfigStore = {
    getState: () => NetworkConfigState;
    subscribe: (onChange: () => void) => () => void;
};
