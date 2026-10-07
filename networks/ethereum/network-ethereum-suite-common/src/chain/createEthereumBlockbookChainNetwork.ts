import {
    type CreateChainNetwork,
    type FetchConnectAccountBalanceDeps,
    type FetchConnectCurrentFiatRateDeps,
    type FetchConnectTokensDeps,
    buildConnectChainNetwork,
    createFetchConnectAccountBalance,
    createFetchConnectCurrentFiatRate,
    createFetchConnectTokens,
} from '@trezor/network-module-suite-common-types';

import {
    EVM_FUNGIBLE_TOKEN_STANDARDS,
    getEthereumChainNetworkConfig,
} from './getEthereumChainNetworkConfig';

export type EthereumBlockbookChainNetworkDeps = FetchConnectAccountBalanceDeps &
    FetchConnectTokensDeps &
    FetchConnectCurrentFiatRateDeps;

/**
 * EVM network served by Blockbook. Blockbook keeps one connection per wallet, so accounts are
 * fetched with their connection identity. Rates of the coin and its tokens come from Blockbook
 * where it quotes the network.
 */
export const createEthereumBlockbookChainNetwork = (
    deps: EthereumBlockbookChainNetworkDeps,
): CreateChainNetwork => {
    const fetchAccountBalance = createFetchConnectAccountBalance(deps);
    const fetchConnectFiatRate = createFetchConnectCurrentFiatRate(deps);
    const fetchTokens = createFetchConnectTokens(deps);

    return params => {
        const config = getEthereumChainNetworkConfig(params.symbol);
        const fetchFiatRate = config.hasBlockbookRates
            ? fetchConnectFiatRate
            : deps.fetchCoinGeckoCurrentRate;
        const rateSource = config.hasFiatRate ? fetchFiatRate : null;

        return buildConnectChainNetwork({
            params,
            nativeAsset: config.nativeAsset,
            decimals: config.decimals,
            accountSyncIntervalMs: config.accountSyncIntervalMs,
            displayBalance: 'availableBalance',
            useConnectionIdentity: true,
            fetchAccountBalance,
            fetchFiatRate: rateSource,
            tokens: {
                fetchTokens,
                fungibleStandards: EVM_FUNGIBLE_TOKEN_STANDARDS,
                fetchTokenFiatRate: rateSource,
            },
        });
    };
};
