import addressValidator from 'trezor-address-validator';
import { Account } from '@wallet-types';

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
    const networkType = isTestnet(symbol) ? 'testnet' : 'prod';
    const updatedSymbol = getCoinFromTestnet(symbol) || symbol;
    return addressValidator.validate(address, updatedSymbol.toUpperCase(), networkType);
};

export const isDecimalsValid = (value: string, decimals: number) => {
    const DECIMALS_RE = new RegExp(
        `^(0|0\\.([0-9]{0,${decimals}})?|[1-9][0-9]*\\.?([0-9]{0,${decimals}})?)$`,
    );
    return DECIMALS_RE.test(value);
};
