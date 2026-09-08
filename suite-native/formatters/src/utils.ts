import { BigNumber } from '@trezor/utils';

export const convertTokenValueToDecimal = (value: string | number, decimals: number): string =>
    BigNumber(value).div(BigNumber(10).exponentiatedBy(decimals)).toString();
