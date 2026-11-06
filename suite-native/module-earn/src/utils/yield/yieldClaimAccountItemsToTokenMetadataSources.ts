import { type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { type YieldClaimAccountItem } from '@suite-common/wallet-core';

export const yieldClaimAccountItemsToTokenMetadataSources = (
    items: readonly YieldClaimAccountItem[],
): TokenMetadataSource[] =>
    items.map(item => ({
        networkSymbol: item.summary.networkSymbol,
        tokens: item.summary.tokens.map(token => ({
            ...token,
            contract: toTokenAddress(token.contractAddress),
        })),
    }));
