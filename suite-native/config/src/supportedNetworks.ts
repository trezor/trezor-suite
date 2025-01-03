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

const discoveryBlacklist: NetworkSymbol[] = ['op', 'base', 'arb'];

// All supported coins for device discovery
export const networkSymbolsWhitelistMap: Record<'mainnet' | 'testnet', readonly NetworkSymbol[]> = {
    mainnet: ['btc', 'eth', 'pol', 'sol', 'bsc', 'ltc', 'etc', 'ada', 'xrp', 'bch', 'doge', 'zec'],
    testnet: ['test', 'regtest', 'tsep', 'thol', 'dsol', 'tada', 'txrp'],
};

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
    getMainnets().filter(network => networkSymbolsWhitelistMap.mainnet.includes(network.symbol)),
).map(network => network.symbol);

const getPortfolioTrackerTestnets = () =>
    sortNetworks(
        getTestnets().filter(network =>
            networkSymbolsWhitelistMap.testnet.includes(network.symbol),
        ),
    ).map(network => network.symbol);

export const portfolioTrackerTestnets = getPortfolioTrackerTestnets();

export const portfolioTrackerSupportedNetworks = [
    ...portfolioTrackerMainnets,
    ...portfolioTrackerTestnets,
];
