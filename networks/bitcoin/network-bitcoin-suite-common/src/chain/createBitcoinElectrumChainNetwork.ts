import {
    type CreateChainNetwork,
    type FetchBlockbookHttpCurrentRateDep,
    type FetchBlockbookHttpHistoricRatesDep,
    type FetchCoinGeckoCurrentRateDep,
    type FetchCoinGeckoHistoricRatesDep,
    type FetchConnectAccountBalanceDeps,
    type FetchConnectTransactionsDeps,
    type FetchCurrentFiatRate,
    type FetchHistoricFiatRates,
    buildConnectChainNetwork,
    createFetchConnectAccountBalance,
    createFetchConnectTransactions,
} from '@trezor/network-module-suite-common-types';

import { getBitcoinChainNetworkConfig } from './getBitcoinChainNetworkConfig';
import { type BitcoinChainSendDeps, createBitcoinChainSend } from './send/createBitcoinChainSend';

export type BitcoinElectrumChainNetworkDeps = FetchConnectAccountBalanceDeps &
    FetchBlockbookHttpCurrentRateDep &
    FetchCoinGeckoCurrentRateDep &
    FetchConnectTransactionsDeps &
    FetchBlockbookHttpHistoricRatesDep &
    FetchCoinGeckoHistoricRatesDep &
    BitcoinChainSendDeps;

/**
 * Bitcoin-like network served by the user's Electrum server. Electrum quotes no rates, so they
 * come from Trezor's public Blockbook API, with CoinGecko as the fallback.
 */
export const createBitcoinElectrumChainNetwork = (
    deps: BitcoinElectrumChainNetworkDeps,
): CreateChainNetwork => {
    const fetchAccountBalance = createFetchConnectAccountBalance(deps);
    const fetchTransactions = createFetchConnectTransactions(deps);
    const fetchHistoricFiatRates: FetchHistoricFiatRates = async params => {
        const rates = await deps.fetchBlockbookHttpHistoricRates(params);

        return Object.keys(rates).length > 0
            ? rates
            : await deps.fetchCoinGeckoHistoricRates(params);
    };
    const fetchFiatRate: FetchCurrentFiatRate = async params =>
        (await deps.fetchBlockbookHttpCurrentRate(params)) ??
        (await deps.fetchCoinGeckoCurrentRate(params));

    const createSend = createBitcoinChainSend(deps);

    return params => {
        const config = getBitcoinChainNetworkConfig(params.symbol);

        return buildConnectChainNetwork({
            params,
            nativeAsset: config.nativeAsset,
            decimals: config.decimals,
            accountSyncIntervalMs: config.accountSyncIntervalMs,
            displayBalance: 'availableBalance',
            useConnectionIdentity: false,
            fetchAccountBalance,
            fetchFiatRate: config.hasFiatRate ? fetchFiatRate : null,
            transactions: {
                fetchTransactions,
                pagination: 'page',
                pageSize: 25,
                useStellarContractTokens: false,
            },
            fetchHistoricFiatRates: config.hasFiatRate ? fetchHistoricFiatRates : null,
            send: createSend(params.symbol),
        });
    };
};
