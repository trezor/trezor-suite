/* @flow */


import BigNumber from 'bignumber.js';

export const decimalToHex = (dec: number): string => new BigNumber(dec).toString(16);

export const hexToDecimal = (hex: number): string => {
    const sanitized: ?string = sanitizeHex(hex);
    return !sanitized ? 'null' : new BigNumber(sanitized).toString();
};

export const sanitizeHex = (hex: number | string): ?string => {
    if (typeof hex !== 'string') return null;
    hex = hex.substring(0, 2) === '0x' ? hex.substring(2) : hex;
    if (hex === '') return '';
    return `0x${padLeftEven(hex)}`;
};

export const padLeftEven = (hex: string): string => {
    hex = hex.length % 2 != 0 ? `0${hex}` : hex;
    return hex;
};

export const strip = (str: string): string => {
    if (str.indexOf('0x') === 0) {
        return padLeftEven(str.substring(2, str.length));
    }
    return padLeftEven(str);
};

export const calcGasPrice = (price: BigNumber, limit: string): string => price.times(limit).toString();