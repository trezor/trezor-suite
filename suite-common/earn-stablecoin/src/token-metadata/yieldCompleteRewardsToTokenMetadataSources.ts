import { type TokenMetadataSource } from '@suite-common/token';
import { type YieldFlowCompleteRewardItem } from '@suite-common/wallet-core';

export const yieldCompleteRewardsToTokenMetadataSources = (
    rewards: readonly YieldFlowCompleteRewardItem[],
): TokenMetadataSource[] =>
    rewards.map(({ token, tokenInfo }) => ({
        networkSymbol: token.networkSymbol,
        tokens: token.contractAddress
            ? [
                  {
                      contract: token.contractAddress,
                      symbol: tokenInfo.symbol,
                      decimals: tokenInfo.decimals,
                  },
              ]
            : [],
    }));
