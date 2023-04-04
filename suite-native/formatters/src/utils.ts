import BigNumber from 'bignumber.js';

export const convertTokenValueToDecimal = (value: string | number, decimals: number) =>
    BigNumber(value).div(10 ** decimals);
