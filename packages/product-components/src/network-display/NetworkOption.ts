import type { NetworkConfig, NetworkSymbol } from '@trezor/network-module-types';

export type NetworkOption = NetworkConfig & {
    readonly symbol: NetworkSymbol;
};
