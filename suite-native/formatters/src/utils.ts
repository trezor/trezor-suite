import { BigNumber } from '@trezor/utils';

export const convertTokenValueToDecimal = (value: string | number, decimals: number) =>
    BigNumber(value).div(BigNumber(10).exponentiatedBy(decimals));
