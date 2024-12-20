import { A } from '@mobily/ts-belt';

import { isTestnet } from '@suite-common/wallet-utils';
import {
    type AccountType,
    type Network,
    type NetworkSymbol,
    getMainnets,
    getTestnets,
    networkSymbolCollection,
} from '@suite-common/wallet-config';

export const orderedAccountTypes: AccountType[] = [
    'normal',
    'taproot',
    'segwit',
    'legacy',
    'ledger',
];

const discoveryBlacklist: NetworkSymbol[] = ['sol', 'dsol', 'op', 'base', 'arb'];

// All supported coins for device discovery
export const networkSymbolsWhitelistMap: Record<'mainnet' | 'testnet', readonly NetworkSymbol[]> = {
    mainnet: [
        'btc',
        'eth',
        'pol',
        'bnb',
        'ltc',
        'etc',
        'ada',
        'xrp',
        'bch',
        'btg',
        'dash',
        'dgb',
        'doge',
        'nmc',
        'vtc',
        'zec',
    ],
    testnet: ['test', 'regtest', 'tsep', 'thol', 'tada', 'txrp'],
};

// Blacklisting coins that are allowed inside `networkSymbolsWhitelistMap` so that we don't have to configs and just filter these out
const portfolioTrackerBlacklist: readonly NetworkSymbol[] = ['btg', 'dash', 'dgb', 'nmc', 'vtc'];

export const discoverySupportedNetworks = [
    ...networkSymbolsWhitelistMap.mainnet,
    ...networkSymbolsWhitelistMap.testnet,
];

export const sortNetworks = (networksToSort: Network[]) =>
    A.sort(networksToSort, (a, b) => {
        const aOrder = networkSymbolCollection.indexOf(a.symbol);
        const bOrder = networkSymbolCollection.indexOf(b.symbol);

        return aOrder - bOrder;
    });

export const filterTestnetNetworks = (
    networkSymbols: NetworkSymbol[],
    isTestnetEnabled: boolean,
) => {
    if (isTestnetEnabled) return networkSymbols;

    return networkSymbols.filter(networkSymbol => !isTestnet(networkSymbol));
};

export const filterBlacklistedNetworks = (
    networksToFilter: Network[],
    allowList: NetworkSymbol[],
) =>
    networksToFilter.filter(
        network =>
            !discoveryBlacklist.includes(network.symbol) || allowList.includes(network.symbol),
    );

export const portfolioTrackerMainnets = sortNetworks(
    getMainnets()
        .filter(network => networkSymbolsWhitelistMap.mainnet.includes(network.symbol))
        .filter(network => !portfolioTrackerBlacklist.includes(network.symbol)),
).map(network => network.symbol);

const getPortfolioTrackerTestnets = () => {
    return sortNetworks(
        getTestnets().filter(network =>
            networkSymbolsWhitelistMap.testnet.includes(network.symbol),
        ),
    ).map(network => network.symbol);
};

export const portfolioTrackerTestnets = getPortfolioTrackerTestnets();

export const portfolioTrackerSupportedNetworks = [
    ...portfolioTrackerMainnets,
    ...portfolioTrackerTestnets,
];
