import { type YieldClaimAccountItem } from '@suite-common/wallet-core';
import { type TokenMetadataSource } from '@suite-native/tokens';

export const yieldClaimAccountItemsToTokenMetadataSources = (
    items: readonly YieldClaimAccountItem[],
): TokenMetadataSource[] =>
    items.map(item => ({
        networkSymbol: item.summary.networkSymbol,
        tokens: item.summary.tokens.map(token => ({
            ...token,
            contract: token.contractAddress,
        })),
    }));
