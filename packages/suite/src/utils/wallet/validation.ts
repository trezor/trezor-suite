// @ts-ignore for now
import addressValidator from 'wallet-address-validator';
import { Account } from '@wallet-types';

const isTestnet = (symbol: Account['symbol']): boolean => {
    const testnets = ['txrp', 'test', 'trop'];
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
        default:
            return symbol;
    }
};

export const isAddressValid = (address: string, symbol: Account['symbol']) => {
    let networkType = 'prod';
    let symbolWithoutTestnets = symbol;

    if (isTestnet(symbol)) {
        networkType = 'testnet';
        symbolWithoutTestnets = getCoinFromTestnet(symbol);
    }

    switch (symbolWithoutTestnets) {
        case 'btc':
        case 'bch':
        case 'btg':
        case 'dash':
        case 'xrp':
        case 'dgb':
        case 'doge':
        case 'ltc':
        case 'nmc':
        case 'vtc':
        case 'zec':
        case 'eth':
        case 'etc':
        case 'xem':
        case 'xlm':
        case 'ada':
        case 'xtz':
            return addressValidator.validate(
                address,
                symbolWithoutTestnets.toUpperCase(),
                networkType,
            );
        // no default
    }
};
