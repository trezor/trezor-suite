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

export const formatTime = (n: number): string => {
    const hours = Math.floor(n / 60);
    const minutes = n % 60;

    if (!n) return 'No time estimate';
    let res = '';
    if (hours !== 0) {
        res += `${hours} hour`;
        if (hours > 1) {
            res += 's';
        }
        res += ' ';
    }
    if (minutes !== 0) {
        res += `${minutes} minutes`;
    }
    return res;
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
        return new BigNumber(amount).div(10 ** decimals).toString(10);
    } catch (error) {
        return '0';
    }
};

export const fromDecimalAmount = (amount: string | number, decimals: number): string => {
    try {
        return new BigNumber(amount).times(10 ** decimals).toString(10);
    } catch (error) {
        return '0';
    }
};
