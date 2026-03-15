import { BigNumber } from '@trezor/utils';

export const normalizeAmountToTokenDecimals = (amount: string, decimals: number) =>
    new BigNumber(amount).decimalPlaces(decimals, BigNumber.ROUND_DOWN).toFixed();

export const getYieldFractionAmount = (maxAmount: string, percentage: number, decimals: number) =>
    normalizeAmountToTokenDecimals(
        new BigNumber(maxAmount).multipliedBy(percentage).dividedBy(100).toString(),
        decimals,
    );
