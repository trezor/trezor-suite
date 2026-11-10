import { type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { type YieldFlowCompleteRewardItem } from '@suite-common/wallet-core';

export const yieldCompleteRewardsToTokenMetadataSources = (
    rewards: readonly YieldFlowCompleteRewardItem[],
): TokenMetadataSource[] =>
    rewards.map(({ token }) => ({
        networkSymbol: token.networkSymbol,
        tokens: token.contractAddress
            ? [
                  {
                      contract: toTokenAddress(token.contractAddress),
                      symbol: token.symbol,
                      decimals: token.decimals,
                  },
              ]
            : [],
    }));
