/* @flow */
'use strict';

import BigNumber from 'bignumber.js'

export const decimalToHex = (dec: number): string => {
    return new BigNumber(dec).toString(16);
}

export const hexToDecimal = (hex: number): string => {
    return new BigNumber(this.sanitizeHex(hex)).toString();
}

export const sanitizeHex = (hex: ?string): string => {
    if (typeof hex !== 'string') return null;
    hex = hex.substring(0, 2) === '0x' ? hex.substring(2) : hex;
    if (hex === '') return '';
    return '0x' + padLeftEven(hex);
}

export const padLeftEven = (hex) => {
    hex = hex.length % 2 != 0 ? '0' + hex : hex;
    return hex;
}

export const strip = (str: string): string => {
    if (str.indexOf('0x') === 0) {
        return padLeftEven( str.substring(2, str.length) );
    }
    return padLeftEven(str);
}

export const calcGasPrice = (price: BigNumber, limit): string => {
    return price.times(limit);
}