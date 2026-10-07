import {
    type CreateChainNetwork,
    type FetchCoinGeckoCurrentRateDep,
    type FetchConnectAccountBalanceDeps,
    type FetchConnectTokensDeps,
    buildConnectChainNetwork,
    createFetchConnectAccountBalance,
    createFetchConnectTokens,
} from '@trezor/network-module-suite-common-types';

import { getEthereumChainNetworkConfig, getEvmTokenRules } from './getEthereumChainNetworkConfig';

export type EthereumCustomRpcChainNetworkDeps = FetchConnectAccountBalanceDeps &
    FetchConnectTokensDeps &
    FetchCoinGeckoCurrentRateDep;

/** EVM network served by the user's own JSON-RPC node, which quotes no rates for coins or tokens. */
export const createEthereumCustomRpcChainNetwork = (
    deps: EthereumCustomRpcChainNetworkDeps,
): CreateChainNetwork => {
    const fetchAccountBalance = createFetchConnectAccountBalance(deps);
    const fetchTokens = createFetchConnectTokens(deps);

    return params => {
        const config = getEthereumChainNetworkConfig(params.symbol);
        const rateSource = config.hasFiatRate ? deps.fetchCoinGeckoCurrentRate : null;

        return buildConnectChainNetwork({
            params,
            nativeAsset: config.nativeAsset,
            decimals: config.decimals,
            accountSyncIntervalMs: config.accountSyncIntervalMs,
            displayBalance: 'availableBalance',
            useConnectionIdentity: true,
            fetchAccountBalance,
            fetchFiatRate: rateSource,
            tokens: {
                fetchTokens,
                ...getEvmTokenRules(),
                fetchTokenFiatRate: rateSource,
            },
        });
    };
};
