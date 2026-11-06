import { createContext } from 'react';

import { type TokenInfoBranded } from '@suite-common/tokens';
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

export type TokenMetadataByNetwork = ReadonlyMap<NetworkSymbol, ReadonlyMap<string, TokenMetadata>>;

type TokenMetadataContextValue = {
    tokensByNetwork: TokenMetadataByNetwork;
};

export const TokenMetadataContext = createContext<TokenMetadataContextValue>({
    tokensByNetwork: new Map(),
});
