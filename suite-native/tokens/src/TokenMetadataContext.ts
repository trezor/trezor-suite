import { createContext } from 'react';

import { type TokenInfoBranded } from '@suite-common/wallet-types';
import { type NetworkSymbol } from '@trezor/network-module-types';

export type TokenMetadata = {
    contract: string;
    name?: string;
    symbol?: string;
    decimals?: number;
    standard?: TokenInfoBranded['standard'];
};

export type TokenMetadataSource = {
    networkSymbol: NetworkSymbol;
    tokens: readonly TokenMetadata[];
};

type TokenMetadataContextValue = {
    sources: readonly TokenMetadataSource[];
    tokensByNetwork: ReadonlyMap<NetworkSymbol, ReadonlyMap<string, TokenMetadata>>;
};

export const TokenMetadataContext = createContext<TokenMetadataContextValue>({
    sources: [],
    tokensByNetwork: new Map(),
});
