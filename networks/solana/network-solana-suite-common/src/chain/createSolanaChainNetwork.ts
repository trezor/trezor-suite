import {
    type CreateChainNetwork,
    type FetchCoinGeckoCurrentRateDep,
    type FetchCoinGeckoHistoricRatesDep,
    type FetchConnectAccountBalanceDeps,
    type FetchConnectTokensDeps,
    type FetchConnectTransactionsDeps,
    buildConnectChainNetwork,
    createFetchConnectAccountBalance,
    createFetchConnectTokens,
    createFetchConnectTransactions,
    readChainNetworkConfig,
} from '@trezor/network-module-suite-common-types';
import { isSupportedSolanaNetwork } from '@trezor/network-solana-types';

import { getAccountSyncInterval, getNetworkConfig } from '../networkConfig';

export type SolanaChainNetworkDeps = FetchConnectAccountBalanceDeps &
    FetchConnectTokensDeps &
    FetchCoinGeckoCurrentRateDep &
    FetchConnectTransactionsDeps &
    FetchCoinGeckoHistoricRatesDep;

/**
 * Solana network served by its RPC backend, which quotes no rates: CoinGecko values the coin and
 * its SPL tokens, which are identified by their mint.
 */
export const createSolanaChainNetwork = (deps: SolanaChainNetworkDeps): CreateChainNetwork => {
    const fetchAccountBalance = createFetchConnectAccountBalance(deps);
    const fetchTransactions = createFetchConnectTransactions(deps);
    const fetchTokens = createFetchConnectTokens(deps);

    return params => {
        const config = readChainNetworkConfig(
            {
                isSupportedNetwork: isSupportedSolanaNetwork,
                getNetworkConfig,
                getAccountSyncInterval,
            },
            params.symbol,
        );
        const rateSource = config.hasFiatRate ? deps.fetchCoinGeckoCurrentRate : null;

        return buildConnectChainNetwork({
            params,
            nativeAsset: config.nativeAsset,
            decimals: config.decimals,
            accountSyncIntervalMs: config.accountSyncIntervalMs,
            displayBalance: 'availableBalance',
            useConnectionIdentity: false,
            fetchAccountBalance,
            fetchFiatRate: rateSource,
            tokens: {
                fetchTokens,
                fungibleStandards: ['SPL', 'SPL-2022'],
                details: 'tokenBalances',
                watchedTokensStrategy: {
                    type: 'contract-filter',
                    isContractCaseInsensitive: false,
                },
                fetchTokenFiatRate: rateSource,
            },
            transactions: {
                fetchTransactions,
                pagination: 'solana-page',
                pageSize: 8,
                useStellarContractTokens: false,
            },
            fetchHistoricFiatRates: config.hasFiatRate ? deps.fetchCoinGeckoHistoricRates : null,
        });
    };
};
