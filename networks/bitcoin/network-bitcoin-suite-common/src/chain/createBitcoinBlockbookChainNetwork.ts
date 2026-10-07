import {
    type CreateChainNetwork,
    type FetchConnectAccountBalanceDeps,
    type FetchConnectCurrentFiatRateDeps,
    buildConnectChainNetwork,
    createFetchConnectAccountBalance,
    createFetchConnectCurrentFiatRate,
} from '@trezor/network-module-suite-common-types';

import { getBitcoinChainNetworkConfig } from './getBitcoinChainNetworkConfig';

export type BitcoinBlockbookChainNetworkDeps = FetchConnectAccountBalanceDeps &
    FetchConnectCurrentFiatRateDeps;

/** Bitcoin-like network served by Blockbook, which also quotes its fiat rates. */
export const createBitcoinBlockbookChainNetwork = (
    deps: BitcoinBlockbookChainNetworkDeps,
): CreateChainNetwork => {
    const fetchAccountBalance = createFetchConnectAccountBalance(deps);
    const fetchFiatRate = createFetchConnectCurrentFiatRate(deps);

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
