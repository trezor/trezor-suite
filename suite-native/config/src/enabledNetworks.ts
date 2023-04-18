import { networks, NetworkSymbol, getMainnets, getTestnets } from '@suite-common/wallet-config';

const deprecatedNetworks = ['dash', 'btg', 'dgb', 'nmc', 'vtc'];

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

export const testnetsOrder: NetworkSymbol[] = ['test', 'regtest', 'tgor', 'tada', 'txrp'];

const filterCardanoAndRipple = (network: NetworkSymbol) =>
    network !== 'ada' && network !== 'xrp' && network !== 'txrp' && network !== 'tada';

const networkSymbols = Object.keys(networks) as NetworkSymbol[];

export const enabledNetworks: NetworkSymbol[] = networkSymbols
    .filter(network => !deprecatedNetworks.includes(network))
    .filter(filterCardanoAndRipple);

export const enabledMainnets = getMainnets().filter(network =>
    enabledNetworks.includes(network.symbol),
);
export const enabledTestnets = getTestnets().filter(network =>
    enabledNetworks.includes(network.symbol),
);
