import { type StablecoinYieldActionReviewState } from '@suite-common/wallet-core';

type YieldClaimReview = Extract<StablecoinYieldActionReviewState, { type: 'claim' }>;

export const buildYieldClaimRewards = (review: YieldClaimReview) =>
    review.rewards.flatMap(reward =>
        reward.token.contractAddress
            ? [
                  {
                      token: {
                          address: reward.token.contractAddress,
                          symbol: reward.token.symbol,
                      },
                  },
              ]
            : [],
    );
