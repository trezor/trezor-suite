import { type RewardDto, type TokenDto } from '../api/yieldxyz';

const isSameToken = (a: TokenDto, b: TokenDto) => {
    if (a.address && b.address) {
        return a.address.toLowerCase() === b.address.toLowerCase();
    }

    if (!a.address && !b.address) {
        return a.network === b.network && a.symbol === b.symbol;
    }

    return false;
};

export const sortRewardsByUnderlyingToken = (
    rewards: RewardDto[],
    underlyingToken: TokenDto | undefined,
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
