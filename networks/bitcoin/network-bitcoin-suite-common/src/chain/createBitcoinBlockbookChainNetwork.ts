import {
    type CreateChainNetwork,
    type FetchConnectAccountBalanceDeps,
    type FetchConnectCurrentFiatRateDeps,
    type FetchConnectHistoricFiatRatesDeps,
    type FetchConnectTransactionsDeps,
    buildConnectChainNetwork,
    createFetchConnectAccountBalance,
    createFetchConnectCurrentFiatRate,
    createFetchConnectHistoricFiatRates,
    createFetchConnectTransactions,
} from '@trezor/network-module-suite-common-types';

import { getBitcoinChainNetworkConfig } from './getBitcoinChainNetworkConfig';
import { type BitcoinChainSendDeps, createBitcoinChainSend } from './send/createBitcoinChainSend';

export type BitcoinBlockbookChainNetworkDeps = FetchConnectAccountBalanceDeps &
    FetchConnectCurrentFiatRateDeps &
    FetchConnectTransactionsDeps &
    FetchConnectHistoricFiatRatesDeps &
    BitcoinChainSendDeps;

/** Bitcoin-like network served by Blockbook, which also quotes its fiat rates. */
export const createBitcoinBlockbookChainNetwork = (
    deps: BitcoinBlockbookChainNetworkDeps,
): CreateChainNetwork => {
    const fetchAccountBalance = createFetchConnectAccountBalance(deps);
    const fetchTransactions = createFetchConnectTransactions(deps);
    const fetchConnectHistoricRates = createFetchConnectHistoricFiatRates(deps);
    const fetchFiatRate = createFetchConnectCurrentFiatRate(deps);

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
            fetchHistoricFiatRates: config.hasFiatRate ? fetchConnectHistoricRates : null,
            send: createSend(params.symbol),
        });
    };
};
