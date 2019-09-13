// @ts-ignore for now
import addressValidator from 'wallet-address-validator';
import { Account } from '@wallet-types';

export const isAddressValid = (
    address: string,
    symbol: Account['symbol'],
    // networkType: Account['networkType'],
) => {
    switch (symbol) {
        case 'btc':
        case 'eth':
        case 'xrp':
        case 'btg':
        case 'ltc':
        case 'bch':
        case 'zec':
            return addressValidator.validate(address, symbol.toUpperCase());
        // no default
    }
};
