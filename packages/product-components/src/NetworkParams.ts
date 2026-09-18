import type { NetworkSymbol } from '@trezor/network-module-types';

export type NetworkParams = {
    networks: readonly NetworkSymbol[];
    networkNamesMap: Record<NetworkSymbol, string> | null;
    isToken?: boolean;
};
