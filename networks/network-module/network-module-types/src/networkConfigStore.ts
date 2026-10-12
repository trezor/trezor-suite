import type { NetworkSymbol } from './networkSymbol';

export type NetworkConfig = {
    readonly name: string;
};

export type NetworkConfigs = Readonly<Record<NetworkSymbol, NetworkConfig>> | null;

export type NetworkConfigState = {
    readonly networks: NetworkConfigs;
};
