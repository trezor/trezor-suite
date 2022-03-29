// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/formatUtils.js

import BigNumber from 'bignumber.js';
import type { BitcoinNetworkInfo, CoinInfo } from '../types';

const currencyUnits = 'btc';

export const formatAmount = (n: string, coinInfo: CoinInfo) =>
    `${new BigNumber(n).div(10 ** coinInfo.decimals).toString(10)} ${coinInfo.shortcut}`;

export const formatAmountOld = (n: number, coinInfo: BitcoinNetworkInfo) => {
    const amount = n / 1e8;
    // if (coinInfo.isBitcoin && currencyUnits === 'mbtc' && amount <= 0.1 && n !== 0) {
    // REF-TODO - this never happens
    // @ts-expect-error
    if (currencyUnits === 'mbtc' && amount <= 0.1 && n !== 0) {
        const s = (n / 1e5).toString();
        return `${s} mBTC`;
    }
    const s = amount.toString();
    return `${s} ${coinInfo.shortcut}`;
};

export const formatTime = (n: number) => {
    if (!n || n <= 0) return 'No time estimate';
    const hours = Math.floor(n / 60);
    const minutes = n % 60;
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

export const btckb2satoshib = (n: string) =>
    new BigNumber(n).times(1e5).toFixed(0, BigNumber.ROUND_HALF_UP);

export const hasHexPrefix = (str: string) => str.slice(0, 2).toLowerCase() === '0x';

export const stripHexPrefix = (str: string) => (hasHexPrefix(str) ? str.slice(2) : str);

// from (isHexString) https://github.com/ethjs/ethjs-util/blob/master/src/index.js
const isHexString = (value: string, length?: number) => {
    if (typeof value !== 'string' || !value.match(/^(0x|0X)?[0-9A-Fa-f]*$/)) {
        return false;
    }
    if (length && value.length !== 2 + 2 * length) {
        return false;
    }
    return true;
};

// from (toBuffer) https://github.com/ethereumjs/ethereumjs-util/blob/master/index.js
export const messageToHex = (message: string) => {
    let buffer: Buffer;
    if (isHexString(message)) {
        let clean = stripHexPrefix(message);
        // pad left even
        if (clean.length % 2 !== 0) {
            clean = `0${clean}`;
        }
        buffer = Buffer.from(clean, 'hex');
    } else {
        buffer = Buffer.from(message);
    }
    return buffer.toString('hex');
};
