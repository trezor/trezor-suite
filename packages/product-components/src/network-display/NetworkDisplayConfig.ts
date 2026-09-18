import type { NetworkSymbol } from '@trezor/network-module-types';

export type NetworkOption = {
    readonly symbol: NetworkSymbol;
    readonly name: string;
};

export type NetworkDisplayConfig = {
    readonly networks: readonly NetworkSymbol[];
    readonly networkNamesMap: Readonly<Partial<Record<NetworkSymbol, string>>> | null;
};
