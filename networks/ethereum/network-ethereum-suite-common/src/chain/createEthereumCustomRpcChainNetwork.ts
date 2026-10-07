import {
    type CreateChainNetwork,
    type FetchCoinGeckoCurrentRateDep,
    type FetchConnectAccountBalanceDeps,
    buildConnectChainNetwork,
    createFetchConnectAccountBalance,
} from '@trezor/network-module-suite-common-types';

import { getEthereumChainNetworkConfig } from './getEthereumChainNetworkConfig';

export type EthereumCustomRpcChainNetworkDeps = FetchConnectAccountBalanceDeps &
    FetchCoinGeckoCurrentRateDep;

/** EVM network served by the user's own JSON-RPC node, which quotes no rates. */
export const createEthereumCustomRpcChainNetwork = (
    deps: EthereumCustomRpcChainNetworkDeps,
): CreateChainNetwork => {
    const fetchAccountBalance = createFetchConnectAccountBalance(deps);

    return params => {
        const config = getEthereumChainNetworkConfig(params.symbol);

        return buildConnectChainNetwork({
            params,
            decimals: config.decimals,
            accountSyncIntervalMs: config.accountSyncIntervalMs,
            displayBalance: 'availableBalance',
            useConnectionIdentity: true,
            fetchAccountBalance,
            fetchFiatRate: config.hasFiatRate ? deps.fetchCoinGeckoCurrentRate : null,
        });
    };
};
