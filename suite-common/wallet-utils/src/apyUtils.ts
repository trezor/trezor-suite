import { BigNumber } from '@trezor/utils';

export const getApyPercent = (apyRate: number): number | null => {
    if (!Number.isFinite(apyRate)) {
        return null;
    }

    return new BigNumber(apyRate).times(100).decimalPlaces(2).toNumber();
};
