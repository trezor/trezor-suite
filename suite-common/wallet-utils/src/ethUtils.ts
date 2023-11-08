import { isValidChecksumAddress, isValidAddress } from '@ethereumjs/util';
import BigNumber from 'bignumber.js';

import { hasUppercaseLetter } from '@trezor/utils';

export const decimalToHex = (dec: number): string => new BigNumber(dec).toString(16);

export const padLeftEven = (hex: string): string => (hex.length % 2 !== 0 ? `0${hex}` : hex);

export const sanitizeHex = ($hex: string): string => {
    const hex = $hex.toLowerCase().substring(0, 2) === '0x' ? $hex.substring(2) : $hex;
    if (hex === '') return '';
    return `0x${padLeftEven(hex)}`;
};

export const hexToDecimal = (hex: number): string => {
    const sanitized: string = sanitizeHex(hex.toString());
    return !sanitized ? 'null' : new BigNumber(sanitized).toString();
};

export const strip = (str: string): string => {
    if (str.indexOf('0x') === 0) {
        return padLeftEven(str.substring(2, str.length));
    }
    return padLeftEven(str);
};

export const validateAddress = (address: string): string | null => {
    if (address.length < 1) {
        return 'Address is not set';
    }
    if (!isValidAddress(address)) {
        return 'Address is not valid';
    }
    if (hasUppercaseLetter(address) && !isValidChecksumAddress(address)) {
        return 'Address is not a valid checksum';
    }
    return null;
};
