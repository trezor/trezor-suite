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

export const testnetsOrder: NetworkSymbol[] = ['test', 'regtest', 'tsep', 'tgor', 'tada', 'txrp', 'dsol'];

// Currently not supported in suite native. When it needs to be supported, just remove this filter.
const filterOutRipple = (network: NetworkSymbol) => network !== 'xrp' && network !== 'txrp';

const networkSymbols = Object.keys(networks) as NetworkSymbol[];

export const enabledNetworks = networkSymbols
    .filter(network => !deprecatedNetworks.includes(network))
    .filter(filterOutRipple);

export const enabledMainnets = getMainnets().filter(network =>
    enabledNetworks.includes(network.symbol),
);
export const enabledTestnets = getTestnets().filter(network =>
    enabledNetworks.includes(network.symbol),
);
