import { BigNumber } from '@trezor/utils';

export const truncateCryptoAmount = (value: BigNumber, decimalPlaces: number): BigNumber =>
    value.decimalPlaces(decimalPlaces, BigNumber.ROUND_DOWN);
