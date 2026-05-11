import { type BigNumber } from '@trezor/utils';

export const formatExchangeRate = (rate: BigNumber): string => {
    if (rate.isGreaterThanOrEqualTo(1)) {
        return rate.toFixed(3);
    }

    return rate.toFixed(-(rate.e ?? 0) + 4);
};
