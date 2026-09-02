import { type YieldActionReviewState } from '@suite-common/wallet-core';

type YieldClaimReview = Extract<YieldActionReviewState, { type: 'claim' }>;

export const buildYieldClaimRewards = (review: YieldClaimReview) =>
    review.rewards.map(reward => {
        if (!reward.token.contractAddress) {
            throw new Error('Yield claim reward is missing a token contract address.');
        }

        return {
            token: {
                address: reward.token.contractAddress,
                symbol: reward.token.symbol,
            },
        };
    });
