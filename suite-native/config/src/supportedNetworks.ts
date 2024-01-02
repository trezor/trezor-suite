import { A } from '@mobily/ts-belt';

import { Network, NetworkSymbol, getMainnets, getTestnets } from '@suite-common/wallet-config';

const discoveryBlacklist: NetworkSymbol[] = ['sol', 'dsol'];

export const supportedPortfolioTrackerNetworks = {
    mainnet: ['btc', 'eth', 'ltc', 'doge', 'etc', 'ada', 'bch', 'xrp', 'zec'] as NetworkSymbol[],
    testnet: ['test', 'regtest', 'tsep', 'tgor', 'thol', 'tada', 'txrp'] as NetworkSymbol[],
} as const satisfies Record<string, NetworkSymbol[]>;

export const supportedPortfolioTrackerNetworkSymbols = [
    ...supportedPortfolioTrackerNetworks.mainnet,
    ...supportedPortfolioTrackerNetworks.testnet,
];

export const sortNetworks = (networks: readonly Network[]) =>
    A.sort(networks, (a, b) => {
        const aOrder =
            supportedPortfolioTrackerNetworkSymbols.indexOf(a.symbol) ?? Number.MAX_SAFE_INTEGER;
        const bOrder =
            supportedPortfolioTrackerNetworkSymbols.indexOf(b.symbol) ?? Number.MAX_SAFE_INTEGER;
        return aOrder - bOrder;
    });

export const filterBlacklistedNetworks = (networks: readonly Network[]) =>
    A.filter(networks, network => !discoveryBlacklist.includes(network.symbol));

export const portfolioTrackerMainnets = filterBlacklistedNetworks(
    sortNetworks(
        getMainnets().filter(network =>
            supportedPortfolioTrackerNetworks.mainnet.includes(network.symbol),
        ),
    ),
);

export const portfolioTrackerTestnets = filterBlacklistedNetworks(
    sortNetworks(
        getTestnets().filter(network =>
            supportedPortfolioTrackerNetworks.testnet.includes(network.symbol),
        ),
    ),
);
