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
import { isSupportedStellarNetwork } from '@trezor/network-stellar-types';

import { getAccountSyncInterval, getNetworkConfig } from '../networkConfig';

export type StellarChainNetworkDeps = FetchConnectAccountBalanceDeps &
    FetchConnectTokensDeps &
    FetchCoinGeckoCurrentRateDep &
    FetchConnectTransactionsDeps &
    FetchCoinGeckoHistoricRatesDep;

/**
 * Stellar network. The ledger holds back a reserve, so the user sees the full balance. Classic
 * assets come with the account's trustlines; Soroban contract tokens no backend lists, so the
 * contracts the user watches are passed along. CoinGecko values the coin and its tokens.
 */
export const createStellarChainNetwork = (deps: StellarChainNetworkDeps): CreateChainNetwork => {
    const fetchAccountBalance = createFetchConnectAccountBalance(deps);
    const fetchTransactions = createFetchConnectTransactions(deps);
    const fetchTokens = createFetchConnectTokens(deps);

    return params => {
        const config = readChainNetworkConfig(
            {
                isSupportedNetwork: isSupportedStellarNetwork,
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
            displayBalance: 'balance',
            useConnectionIdentity: false,
            fetchAccountBalance,
            fetchFiatRate: rateSource,
            tokens: {
                fetchTokens,
                fungibleStandards: ['STELLAR-CLASSIC', 'STELLAR-CONTRACT'],
                details: 'basic',
                watchedTokensStrategy: { type: 'stellar-contract-tokens' },
                fetchTokenFiatRate: rateSource,
            },
            transactions: {
                fetchTransactions,
                pagination: 'stellar-cursor',
                pageSize: 25,
                useStellarContractTokens: true,
            },
            fetchHistoricFiatRates: config.hasFiatRate ? deps.fetchCoinGeckoHistoricRates : null,
        });
    };
};
