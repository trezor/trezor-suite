// @ts-ignore for now

// TODO: use validation from connect and remove this file

import addressValidator from 'multicoin-address-validator';
import { Account } from '@wallet-types';
import validator from 'validator';

const isTestnet = (symbol: Account['symbol']): boolean => {
    const testnets = ['test', 'txrp', 'trop'];
    return testnets.includes(symbol);
};

const getCoinFromTestnet = (symbol: Account['symbol']) => {
    switch (symbol) {
        case 'test':
            return 'btc';
        case 'txrp':
            return 'xrp';
        case 'trop':
            return 'eth';
        // no default
    }
};

export const isAddressValid = (address: string, symbol: Account['symbol']) => {
    let networkType = 'prod';
    let symbolWithoutTestnets = null;

    if (isTestnet(symbol)) {
        networkType = 'testnet';
        symbolWithoutTestnets = getCoinFromTestnet(symbol);
    }

    const updatedSymbol = symbolWithoutTestnets || symbol;

    switch (updatedSymbol) {
        case 'btc':
        case 'bch':
        case 'btg':
        case 'dash':
        case 'xrp':
        case 'doge':
        case 'ltc':
        case 'nmc':
        case 'vtc':
        case 'zec':
        case 'eth':
        case 'etc':
            return addressValidator.validate(address, updatedSymbol.toUpperCase(), networkType);
        case 'dgb':
            return validator.isBtcAddress(address);
        // no default
    }
};
