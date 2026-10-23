import { BigNumber } from '@trezor/utils';

export const formatCryptoAmountAsAmount = (
    amount: number | BigNumber,
    baseAmount: number | BigNumber,
    decimals = 8,
): string => {
    const baseAmountBigNumber = new BigNumber(baseAmount);
    let digits = 4;

    if (baseAmountBigNumber.lt(1)) {
        digits = 6;
    }

    if (baseAmountBigNumber.lt(0.01)) {
        digits = decimals;
    }

    return amount.toFixed(digits);
};
