import { networks, NetworkSymbol } from '@suite-common/wallet-config';

// ordering defined by product - it is done according to the data about the coins and usage of them in Desktop Suite
export const mainnetsOrder: NetworkSymbol[] = [
    'btc',
    'eth',
    'ltc',
    'doge',
    'etc',
    'ada',
    'bch',
    'xrp',
    'dash',
    'zec',
    'btg',
    'vtc',
    'nmc',
    'dgb',
];

export const testnetsOrder: NetworkSymbol[] = ['test', 'regtest', 'tgor', 'trop', 'tada', 'txrp'];

export const enabledNetworks: NetworkSymbol[] = Object.keys(networks) as NetworkSymbol[];
