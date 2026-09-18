import type { NetworkSymbol } from '@suite-common/wallet-config';

export type NetworkParams<TSymbol extends NetworkSymbol = NetworkSymbol> = {
    networks: readonly TSymbol[];
    networkNamesMap: Record<TSymbol, string> | null;
    isToken?: boolean;
};
