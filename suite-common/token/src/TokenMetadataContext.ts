import { createContext } from 'react';

import { type TokenAddress, type TokenInfoBranded } from '@suite-common/tokens';
import { type NetworkSymbol } from '@trezor/network-module-types';

export type TokenMetadata = {
    contract: TokenAddress;
    name?: string;
    symbol?: string;
    decimals?: number;
    standard?: TokenInfoBranded['standard'];
};

export type TokenMetadataSource = {
    networkSymbol: NetworkSymbol;
    tokens: readonly TokenMetadata[];
};

export type TokenMetadataByNetwork = ReadonlyMap<
    NetworkSymbol,
    ReadonlyMap<TokenAddress, TokenMetadata>
>;

type TokenMetadataContextValue = {
    sources: readonly TokenMetadataSource[];
    tokensByNetwork: TokenMetadataByNetwork;
};

export const TokenMetadataContext = createContext<TokenMetadataContextValue>({
    sources: [],
    tokensByNetwork: new Map(),
});
