import { A } from '@mobily/ts-belt';

import { isTestnet } from '@suite-common/wallet-utils';
import {
    AccountType,
    Network,
    NetworkSymbol,
    getMainnets,
    getTestnets,
} from '@suite-common/wallet-config';

export const orderedAccountTypes: AccountType[] = [
    'normal',
    'taproot',
    'segwit',
    'legacy',
    'ledger',
];

const discoveryBlacklist: NetworkSymbol[] = ['sol', 'dsol', 'pol', 'bnb'];

// All supported coins for device discovery
export const networkSymbolsWhitelistMap = {
    mainnet: [
        'btc',
        'eth',
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
    ] as NetworkSymbol[],
    testnet: ['test', 'regtest', 'tsep', 'thol', 'tada', 'txrp'] as NetworkSymbol[],
} as const satisfies Record<string, NetworkSymbol[]>;

// Blacklisting coins that are allowed inside `networkSymbolsWhitelistMap` so that we don't have to configs and just filter these out
const portfolioTrackerBlacklist = ['btg', 'dash', 'dgb', 'nmc', 'vtc'];

export const discoverySupportedNetworks = [
    ...networkSymbolsWhitelistMap.mainnet,
    ...networkSymbolsWhitelistMap.testnet,
];

export const sortNetworks = (networks: Network[]) =>
    A.sort(networks, (a, b) => {
        const aOrder = discoverySupportedNetworks.indexOf(a.symbol) ?? Number.MAX_SAFE_INTEGER;
        const bOrder = discoverySupportedNetworks.indexOf(b.symbol) ?? Number.MAX_SAFE_INTEGER;

        return aOrder - bOrder;
    });

export const filterTestnetNetworks = (
    networkSymbols: NetworkSymbol[],
    isTestnetEnabled: boolean,
) => {
    if (isTestnetEnabled) return networkSymbols;

    return networkSymbols.filter(networkSymbol => !isTestnet(networkSymbol));
};

export const filterBlacklistedNetworks = (networks: Network[], allowList: NetworkSymbol[]) =>
    networks.filter(
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
