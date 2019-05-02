/* @flow */

import BigNumber from 'bignumber.js';

export const toDecimalAmount = (amount: string | number, decimals: number): string => {
    try {
        const bAmount = new BigNumber(amount);
        // BigNumber() returns NaN on non-numeric string
        if (bAmount.isNaN()) {
            throw new Error('Amount is not a number');
        }
        return bAmount.div(10 ** decimals).toString(10);
    } catch (error) {
        return '0';
    }
};

export const fromDecimalAmount = (amount: string | number, decimals: number): string => {
    try {
        const bAmount = new BigNumber(amount);
        // BigNumber() returns NaN on non-numeric string
        if (bAmount.isNaN()) {
            throw new Error('Amount is not a number');
        }
        return bAmount.times(10 ** decimals).toString(10);
    } catch (error) {
        return '0';
    }
};

export const byteLength = (text: string): number => {
    // returns length of the text in bytes, 0 in case of error.
    try {
        // regexp is handling cases when encodeURI returns '%uXXXX' or %XX%XX
        return encodeURI(text).split(/%(?:u[0-9A-F]{2})?[0-9A-F]{2}|./).length - 1;
    } catch (error) {
        console.error(error);
        return 0;
    }
};
