import addressValidator from 'trezor-address-validator';

import { getTestnetSymbols } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';

const getNetworkType = (symbol: Account['symbol']) => {
    if (symbol === 'regtest') return symbol;
    const testnets = getTestnetSymbols();
    return testnets.includes(symbol) ? 'testnet' : 'prod';
};

const getCoinFromTestnet = (symbol: Account['symbol']) => {
    switch (symbol) {
        case 'test':
        case 'regtest':
            return 'btc';
        case 'txrp':
            return 'xrp';
        case 'tada':
            return 'ada';
        case 'tsep':
        case 'tgor':
            return 'eth';
        default:
            return symbol;
    }
};

export const isAddressValid = (address: string, symbol: Account['symbol']) => {
    const networkType = getNetworkType(symbol);
    const updatedSymbol = getCoinFromTestnet(symbol);

    return addressValidator.validate(address, updatedSymbol.toUpperCase(), networkType);
};

export const isAddressDeprecated = (address: string, symbol: Account['symbol']) => {
    // catch deprecated address formats
    // LTC starting with "3" and valid with a BTC format
    if (symbol === 'ltc' && address.startsWith('3') && isAddressValid(address, 'btc')) {
        return 'LTC_ADDRESS_INFO_URL';
    }
    // BCH starting with "1" and valid with a BTC format
    if (symbol === 'bch' && address.startsWith('1') && isAddressValid(address, 'btc')) {
        return 'HELP_CENTER_CASHADDR_URL';
    }
};

export const isTaprootAddress = (address: string, symbol: Account['symbol']) => {
    const networkType = getNetworkType(symbol);
    const updatedSymbol = getCoinFromTestnet(symbol);
    return (
        addressValidator.getAddressType(address, updatedSymbol.toUpperCase(), networkType) ===
        'p2tr'
    );
};

export const isBech32AddressUppercase = (address: string) =>
    /^(bc1|tb1|ltc1|tltc1|vtc1|tvtc1)/.test(address.toLowerCase()) && /[A-Z]/.test(address);

export const isDecimalsValid = (value: string, decimals: number) => {
    const DECIMALS_RE = new RegExp(
        `^(0|0\\.([0-9]{0,${decimals}})?|[1-9][0-9]*\\.?([0-9]{0,${decimals}})?)$`,
    );
    return DECIMALS_RE.test(value);
};

export const isInteger = (value: string) =>
    // exclude leading zeros
    /^(?:[1-9][0-9]*|0)$/.test(value);

export const isHexValid = (value: string, prefix?: string) => {
    // ethereum data/signedTx may start with prefix
    if (prefix && value.indexOf(prefix) === 0) {
        const hex = value.substring(prefix.length, value.length);
        // pad left even, is it necessary in ETH?
        // TODO: investigate
        value = hex.length % 2 !== 0 ? `0${hex}` : hex;
    }

    if (value.length % 2 !== 0) return false;
    // TODO: ETH may contain uppercase? does BTC as well?
    if (!/^[0-9A-Fa-f]+$/.test(value)) return false;
    return true;
};
