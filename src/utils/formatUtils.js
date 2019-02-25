/* @flow */

import BigNumber from 'bignumber.js';

const currencyUnitsConstant: string = 'mbtc2';

export const formatAmount = (n: number, coinInfo: any, currencyUnits: string = currencyUnitsConstant): string => {
    const amount = (n / 1e8);
    if (coinInfo.isBitcoin && currencyUnits === 'mbtc' && amount <= 0.1 && n !== 0) {
        const s = (n / 1e5).toString();
        return `${s} mBTC`;
    }
    const s = amount.toString();
    return `${s} ${coinInfo.shortcut}`;
};

export const btckb2satoshib = (n: number): number => Math.round(n * 1e5);

export const stringToHex = (str: string): string => {
    let result: string = '';
    let hex: string;
    for (let i = 0; i < str.length; i++) {
        hex = str.charCodeAt(i).toString(16);
        result += (`000${hex}`).slice(-4);
    }
    return result;
};

export const hexToString = (hex: string): string => {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        const v = parseInt(hex.substr(i, 2), 16);
        if (v) str += String.fromCharCode(v);
    }
    return str;
};

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
