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

type ResolveTokenMetadata = (
    networkSymbol: NetworkSymbol,
    contractAddress: string,
) => TokenMetadata | null;

export const TokenMetadataContext = createContext<ResolveTokenMetadata>(() => null);
