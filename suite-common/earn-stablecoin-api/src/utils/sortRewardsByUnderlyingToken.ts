import { type RewardDtoV2, type TokenDtoV2 } from '@suite-common/earn-stablecoin-defs';

const isSameToken = (a: TokenDtoV2, b: TokenDtoV2) => {
    if (a.address && b.address) {
        return a.address.toLowerCase() === b.address.toLowerCase();
    }

    if (!a.address && !b.address) {
        return a.network === b.network && a.symbol === b.symbol;
    }

    return false;
};

export const sortRewardsByUnderlyingToken = (
    rewards: RewardDtoV2[],
    underlyingToken: TokenDtoV2 | undefined,
) =>
    rewards.toSorted((a, b) => {
        if (underlyingToken) {
            const isAUnderlying = isSameToken(a.token, underlyingToken);
            const isBUnderlying = isSameToken(b.token, underlyingToken);

            if (isAUnderlying && !isBUnderlying) return -1;
            if (isBUnderlying && !isAUnderlying) return 1;
        }

        return b.rate - a.rate;
    });

export const getBonusRewardToken = (
    rewards: RewardDtoV2[],
    underlyingToken: TokenDtoV2 | undefined,
) => {
    if (!underlyingToken) {
        return null;
    }

    return rewards.find(reward => !isSameToken(reward.token, underlyingToken))?.token ?? null;
};
