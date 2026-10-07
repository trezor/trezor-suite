import {
    type CreateChainNetwork,
    type FetchConnectAccountBalanceDeps,
    type FetchConnectCurrentFiatRateDeps,
    type FetchConnectHistoricFiatRatesDeps,
    type FetchConnectTokensDeps,
    type FetchConnectTransactionsDeps,
    buildConnectChainNetwork,
    createFetchConnectAccountBalance,
    createFetchConnectCurrentFiatRate,
    createFetchConnectHistoricFiatRates,
    createFetchConnectTokens,
    createFetchConnectTransactions,
} from '@trezor/network-module-suite-common-types';

import { getEthereumChainNetworkConfig, getEvmTokenRules } from './getEthereumChainNetworkConfig';

export type EthereumBlockbookChainNetworkDeps = FetchConnectAccountBalanceDeps &
    FetchConnectTokensDeps &
    FetchConnectCurrentFiatRateDeps &
    FetchConnectTransactionsDeps &
    FetchConnectHistoricFiatRatesDeps;

/**
 * EVM network served by Blockbook. Blockbook keeps one connection per wallet, so accounts are
 * fetched with their connection identity. Rates of the coin and its tokens come from Blockbook
 * where it quotes the network.
 */
export const createEthereumBlockbookChainNetwork = (
    deps: EthereumBlockbookChainNetworkDeps,
): CreateChainNetwork => {
    const fetchAccountBalance = createFetchConnectAccountBalance(deps);
    const fetchTransactions = createFetchConnectTransactions(deps);
    const fetchConnectHistoricRates = createFetchConnectHistoricFiatRates(deps);
    const fetchConnectFiatRate = createFetchConnectCurrentFiatRate(deps);
    const fetchTokens = createFetchConnectTokens(deps);

    return params => {
        const config = getEthereumChainNetworkConfig(params.symbol);
        const fetchFiatRate = config.hasBlockbookRates
            ? fetchConnectFiatRate
            : deps.fetchCoinGeckoCurrentRate;
        const rateSource = config.hasFiatRate ? fetchFiatRate : null;

        const fetchHistoricRates = config.hasBlockbookRates
            ? fetchConnectHistoricRates
            : deps.fetchCoinGeckoHistoricRates;

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
                ...getEvmTokenRules(),
                fetchTokenFiatRate: rateSource,
            },
            transactions: {
                fetchTransactions,
                pagination: 'page',
                pageSize: 25,
                useStellarContractTokens: false,
                protocols: ['erc4626'],
            },
            fetchHistoricFiatRates: config.hasFiatRate ? fetchHistoricRates : null,
        });
    };
};
