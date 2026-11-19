import { type TokenMetadataSource } from '@suite-common/token';
import { type YieldListItem } from '@suite-common/wallet-core';

export const yieldPositionsToTokenMetadataSources = (
    positions: readonly YieldListItem[],
): TokenMetadataSource[] =>
    positions.map(position => ({
        networkSymbol: position.networkSymbol,
        tokens: [
            {
                contract: position.tokenContractAddress,
                symbol: position.tokenSymbol,
                decimals: position.token?.decimals,
            },
        ],
    }));
