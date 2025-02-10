import { A } from '@mobily/ts-belt';

import {
    type AccountType,
    type Network,
    type NetworkSymbol,
    getMainnets,
    getTestnets,
    networkSymbolCollection,
} from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';

export const orderedAccountTypes: AccountType[] = [
    'normal',
    'taproot',
    'segwit',
    'legacy',
    'ledger',
];

// All supported coins for device discovery
export const networkSymbolsWhitelistMap: Record<'mainnet' | 'testnet', readonly NetworkSymbol[]> = {
    mainnet: [
        'btc',
        'eth',
        'pol',
        'sol',
        'bsc',
        'ltc',
        'etc',
        'ada',
        'xrp',
        'bch',
        'doge',
        'zec',
        'op',
        'base',
        'arb',
    ],
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
