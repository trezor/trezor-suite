import type { NetworkSymbol } from '@trezor/network-module-types';

export type NetworkDisplayConfig = {
    readonly name: string;
};

export type NetworkOption = NetworkDisplayConfig & {
    readonly symbol: NetworkSymbol;
};

export type NetworkDisplayState = {
    readonly networks: Readonly<Record<NetworkSymbol, NetworkDisplayConfig>> | null;
};

export type NetworkDisplayStore = {
    getState: () => NetworkDisplayState;
    subscribe: (onChange: () => void) => () => void;
};
