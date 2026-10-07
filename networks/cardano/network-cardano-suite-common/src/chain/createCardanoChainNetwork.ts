import { isSupportedCardanoNetwork } from '@trezor/network-cardano-types';
import {
    type CreateChainNetwork,
    type FetchCoinGeckoCurrentRateDep,
    type FetchConnectAccountBalanceDeps,
    type FetchConnectTokensDeps,
    buildConnectChainNetwork,
    createFetchConnectAccountBalance,
    createFetchConnectTokens,
    readChainNetworkConfig,
} from '@trezor/network-module-suite-common-types';

import { getAccountSyncInterval, getNetworkConfig } from '../networkConfig';

export type CardanoChainNetworkDeps = FetchConnectAccountBalanceDeps &
    FetchConnectTokensDeps &
    FetchCoinGeckoCurrentRateDep;

/**
 * Cardano network served by Blockfrost. Native tokens are identified by policy id and asset
 * name; Blockfrost quotes no rates, so the coin and its tokens are valued by CoinGecko.
 *
 * Staked ADA is part of the balance itself, so the displayed balance already holds it.
 */
export const createCardanoChainNetwork = (deps: CardanoChainNetworkDeps): CreateChainNetwork => {
    const fetchAccountBalance = createFetchConnectAccountBalance(deps);
    const fetchTokens = createFetchConnectTokens(deps);

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
        });
    };
};
