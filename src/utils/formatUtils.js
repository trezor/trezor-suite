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
