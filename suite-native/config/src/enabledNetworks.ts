import { networks, NetworkSymbol, getMainnets, getTestnets } from '@suite-common/wallet-config';

const deprecatedNetworks = ['dash', 'btg', 'dgb', 'nmc', 'vtc'];

// ordering defined by product - it is done according to the data about the coins and usage of them in Desktop Suite
export const mainnetsOrder: NetworkSymbol[] = [
    'btc',
    'eth',
    'ltc',
    'doge',
    'etc',
    'bch',
    'dash',
    'zec',
    'btg',
    'vtc',
    'nmc',
    'dgb',
];

export const testnetsOrder: NetworkSymbol[] = ['test', 'regtest', 'tgor'];

export const enabledNetworks: NetworkSymbol[] = Object.keys(networks).filter(
    network => !deprecatedNetworks.includes(network),
) as NetworkSymbol[];

export const enabledMainnets = getMainnets().filter(network =>
    enabledNetworks.includes(network.symbol),
);
export const enabledTestnets = getTestnets().filter(network =>
    enabledNetworks.includes(network.symbol),
);
