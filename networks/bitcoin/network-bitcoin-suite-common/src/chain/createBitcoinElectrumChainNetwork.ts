import {
    type CreateChainNetwork,
    type FetchBlockbookHttpCurrentRateDep,
    type FetchCoinGeckoCurrentRateDep,
    type FetchConnectAccountBalanceDeps,
    type FetchCurrentFiatRate,
    buildConnectChainNetwork,
    createFetchConnectAccountBalance,
} from '@trezor/network-module-suite-common-types';

import { getBitcoinChainNetworkConfig } from './getBitcoinChainNetworkConfig';

export type BitcoinElectrumChainNetworkDeps = FetchConnectAccountBalanceDeps &
    FetchBlockbookHttpCurrentRateDep &
    FetchCoinGeckoCurrentRateDep;

/**
 * Bitcoin-like network served by the user's Electrum server. Electrum quotes no rates, so they
 * come from Trezor's public Blockbook API, with CoinGecko as the fallback.
 */
export const createBitcoinElectrumChainNetwork = (
    deps: BitcoinElectrumChainNetworkDeps,
): CreateChainNetwork => {
    const fetchAccountBalance = createFetchConnectAccountBalance(deps);
    const fetchFiatRate: FetchCurrentFiatRate = async params =>
        (await deps.fetchBlockbookHttpCurrentRate(params)) ??
        (await deps.fetchCoinGeckoCurrentRate(params));

    return params => {
        const config = getBitcoinChainNetworkConfig(params.symbol);

        return buildConnectChainNetwork({
            params,
            decimals: config.decimals,
            accountSyncIntervalMs: config.accountSyncIntervalMs,
            displayBalance: 'availableBalance',
            useConnectionIdentity: false,
            fetchAccountBalance,
            fetchFiatRate: config.hasFiatRate ? fetchFiatRate : null,
        });
    };
};
