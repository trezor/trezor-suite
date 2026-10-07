import { isSupportedCardanoNetwork } from '@trezor/network-cardano-types';
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

import { getAccountSyncInterval, getNetworkConfig } from '../networkConfig';
import { type CardanoChainSendDeps, createCardanoChainSend } from './send/createCardanoChainSend';

export type CardanoChainNetworkDeps = FetchConnectAccountBalanceDeps &
    FetchConnectTokensDeps &
    FetchCoinGeckoCurrentRateDep &
    FetchConnectTransactionsDeps &
    FetchCoinGeckoHistoricRatesDep &
    CardanoChainSendDeps;

/**
 * Cardano network served by Blockfrost. Native tokens are identified by policy id and asset
 * name; Blockfrost quotes no rates, so the coin and its tokens are valued by CoinGecko.
 *
 * Staked ADA is part of the balance itself, so the displayed balance already holds it.
 */
export const createCardanoChainNetwork = (deps: CardanoChainNetworkDeps): CreateChainNetwork => {
    const fetchAccountBalance = createFetchConnectAccountBalance(deps);
    const fetchTransactions = createFetchConnectTransactions(deps);
    const fetchTokens = createFetchConnectTokens(deps);
    const createSend = createCardanoChainSend(deps);

    return params => {
        const config = readChainNetworkConfig(
            {
                isSupportedNetwork: isSupportedCardanoNetwork,
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
                fungibleStandards: ['BLOCKFROST'],
                details: 'tokenBalances',
                watchedTokensStrategy: {
                    type: 'contract-filter',
                    isContractCaseInsensitive: false,
                },
                fetchTokenFiatRate: rateSource,
            },
            transactions: {
                fetchTransactions,
                pagination: 'page',
                pageSize: 8,
                useStellarContractTokens: false,
            },
            fetchHistoricFiatRates: config.hasFiatRate ? deps.fetchCoinGeckoHistoricRates : null,
            send: createSend(params.symbol),
        });
    };
};
