import {
    type CreateChainNetwork,
    type FetchConnectAccountBalanceDeps,
    type FetchConnectCurrentFiatRateDeps,
    type FetchConnectTokensDeps,
    buildConnectChainNetwork,
    createFetchConnectAccountBalance,
    createFetchConnectCurrentFiatRate,
    createFetchConnectTokens,
    readChainNetworkConfig,
} from '@trezor/network-module-suite-common-types';
import { isSupportedTronNetwork } from '@trezor/network-tron-types';

import { getAccountSyncInterval, getNetworkConfig } from '../networkConfig';

export type TronChainNetworkDeps = FetchConnectAccountBalanceDeps &
    FetchConnectTokensDeps &
    FetchConnectCurrentFiatRateDeps;

/**
 * Tron network served by Blockbook, which also quotes the coin and its TRC10/TRC20 tokens.
 * Frozen TRX is staking, not part of the displayed balance.
 */
export const createTronChainNetwork = (deps: TronChainNetworkDeps): CreateChainNetwork => {
    const fetchAccountBalance = createFetchConnectAccountBalance(deps);
    const fetchTokens = createFetchConnectTokens(deps);
    const fetchConnectFiatRate = createFetchConnectCurrentFiatRate(deps);

    return params => {
        const config = readChainNetworkConfig(
            {
                isSupportedNetwork: isSupportedTronNetwork,
                getNetworkConfig,
                getAccountSyncInterval,
            },
            params.symbol,
        );
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
            useConnectionIdentity: false,
            fetchAccountBalance,
            fetchFiatRate: rateSource,
            tokens: {
                fetchTokens,
                fungibleStandards: ['TRC10', 'TRC20'],
                details: 'tokenBalances',
                watchedTokensStrategy: {
                    type: 'contract-filter',
                    isContractCaseInsensitive: false,
                },
                fetchTokenFiatRate: rateSource,
            },
        });
    };
};
