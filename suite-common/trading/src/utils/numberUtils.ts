import { type BigNumber } from '@trezor/utils';

export const clamp = (
    value: number,
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY,
) => Math.min(Math.max(value, min), max);

export const formatExchangeRate = (rate: BigNumber): string => {
    if (rate.isGreaterThanOrEqualTo(1)) {
        return rate.toFixed(3);
    }

    return rate.toFixed(-(rate.e ?? 0) + 4);
};
