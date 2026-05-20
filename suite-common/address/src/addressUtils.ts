import { type NetworkSymbol, getTestnetSymbols } from '@suite-common/wallet-config';

export const getAddressNetworkType = (symbol: NetworkSymbol, address: string) => {
    if (symbol === 'regtest') return symbol;
    const testnets = getTestnetSymbols();

    if (symbol === 'ada' && address.startsWith('stake')) return 'stake';

    return testnets.includes(symbol) ? 'testnet' : 'prod';
};

export const getCoinFromTestnet = (symbol: NetworkSymbol) => {
    switch (symbol) {
        case 'test':
        case 'regtest':
            return 'btc';
        case 'txrp':
            return 'xrp';
        case 'txlm':
            return 'xlm';
        case 'dsol':
            return 'sol';
        case 'tsep':
        case 'thod':
            return 'eth';
        default:
            return symbol;
    }
};
