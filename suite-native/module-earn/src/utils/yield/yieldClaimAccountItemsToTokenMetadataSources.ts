import { type TokenMetadataSource } from '@suite-common/token';
import { type YieldClaimAccountItem } from '@suite-common/wallet-core';

export const yieldClaimAccountItemsToTokenMetadataSources = (
    items: readonly YieldClaimAccountItem[],
): TokenMetadataSource[] =>
    items.map(item => ({
        networkSymbol: item.summary.networkSymbol,
        tokens: item.summary.tokens.map(token => ({
            contract: token.contractAddress,
            symbol: token.symbol,
            decimals: token.decimals,
        })),
    }));
