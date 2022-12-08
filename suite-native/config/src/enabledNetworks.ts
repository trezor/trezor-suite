import {
    networks,
    NetworkSymbol,
    Network,
    getTestnets,
    getMainnets,
} from '@suite-common/wallet-config';

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

export const mainnets: Network[] = getMainnets();

export const testnets: Network[] = getTestnets();
