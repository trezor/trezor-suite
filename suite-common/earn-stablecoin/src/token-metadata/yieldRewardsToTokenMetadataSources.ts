import { type RewardDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';

type YieldRewardsToTokenMetadataSourcesParams = {
    networkSymbol: NetworkSymbol;
    rewards: readonly Pick<RewardDtoV2, 'token'>[];
};

/** The tokens a vault's APY is paid in; reward tokens are rarely held. */
export const yieldRewardsToTokenMetadataSources = ({
    networkSymbol,
    rewards,
}: YieldRewardsToTokenMetadataSourcesParams): TokenMetadataSource[] => [
    {
        networkSymbol,
        tokens: rewards.flatMap(({ token }) =>
            token.address
                ? [
                      {
                          contract: toTokenAddress(token.address),
                          name: token.name,
                          symbol: token.symbol,
                          decimals: token.decimals,
                      },
                  ]
                : [],
        ),
    },
];
