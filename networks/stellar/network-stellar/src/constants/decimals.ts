import { BigNumber } from '@trezor/utils';

export const STELLAR_DECIMALS = 7;

// Converts an amount from lumens (decimal) to stroops (integer base unit).
export const toStroops = (value: number | string) =>
    new BigNumber(10).pow(STELLAR_DECIMALS).times(new BigNumber(value));
