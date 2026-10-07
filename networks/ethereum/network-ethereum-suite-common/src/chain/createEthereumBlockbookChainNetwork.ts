import {
    type CreateChainNetwork,
    type FetchConnectAccountBalanceDeps,
    type FetchConnectCurrentFiatRateDeps,
    buildConnectChainNetwork,
    createFetchConnectAccountBalance,
    createFetchConnectCurrentFiatRate,
} from '@trezor/network-module-suite-common-types';

import { getEthereumChainNetworkConfig } from './getEthereumChainNetworkConfig';

export type EthereumBlockbookChainNetworkDeps = FetchConnectAccountBalanceDeps &
    FetchConnectCurrentFiatRateDeps;

/**
 * EVM network served by Blockbook. Blockbook keeps one connection per wallet, so accounts are
 * fetched with their connection identity. Rates come from Blockbook where it quotes the network.
 */
export const createEthereumBlockbookChainNetwork = (
    deps: EthereumBlockbookChainNetworkDeps,
): CreateChainNetwork => {
    const fetchAccountBalance = createFetchConnectAccountBalance(deps);
    const fetchConnectFiatRate = createFetchConnectCurrentFiatRate(deps);

    return params => {
        const config = getEthereumChainNetworkConfig(params.symbol);
        const fetchFiatRate = config.hasBlockbookRates
            ? fetchConnectFiatRate
            : deps.fetchCoinGeckoCurrentRate;

        return buildConnectChainNetwork({
            params,
            decimals: config.decimals,
            accountSyncIntervalMs: config.accountSyncIntervalMs,
            displayBalance: 'availableBalance',
            useConnectionIdentity: true,
            fetchAccountBalance,
            fetchFiatRate: config.hasFiatRate ? fetchFiatRate : null,
        });
    };
};
