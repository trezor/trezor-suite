import {
    type CreateChainNetwork,
    type FetchCoinGeckoCurrentRateDep,
    type FetchCoinGeckoHistoricRatesDep,
    type FetchConnectAccountBalanceDeps,
    type FetchConnectTokensDeps,
    buildConnectChainNetwork,
    createFetchConnectAccountBalance,
    createFetchConnectTokens,
} from '@trezor/network-module-suite-common-types';

import { getEthereumChainNetworkConfig, getEvmTokenRules } from './getEthereumChainNetworkConfig';
import { createEvmAccountNonce } from './nonce/createEvmAccountNonce';
import { createReadEvmRpcNonce } from './nonce/readEvmNonce';
import {
    type EthereumChainNetworkSendDeps,
    createEthereumChainSend,
} from './send/createEthereumChainSend';

export type EthereumCustomRpcChainNetworkDeps = FetchConnectAccountBalanceDeps &
    FetchConnectTokensDeps &
    FetchCoinGeckoCurrentRateDep &
    FetchCoinGeckoHistoricRatesDep &
    EthereumChainNetworkSendDeps;

/** EVM network served by the user's own JSON-RPC node, which quotes no rates for coins or tokens. */
export const createEthereumCustomRpcChainNetwork = (
    deps: EthereumCustomRpcChainNetworkDeps,
): CreateChainNetwork => {
    const fetchAccountBalance = createFetchConnectAccountBalance(deps);
    const fetchTokens = createFetchConnectTokens(deps);
    const readNonce = createReadEvmRpcNonce(deps);

    return params => {
        const config = getEthereumChainNetworkConfig(params.symbol);
        const nonce = createEvmAccountNonce(
            { readNonce, getChainPendingSends: deps.getChainPendingSends },
            { symbol: params.symbol, backendType: params.backend.type },
        );
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
            fetchHistoricFiatRates: config.hasFiatRate ? deps.fetchCoinGeckoHistoricRates : null,
            getAccountNonce: nonce.getAccountNonce,
            send: createEthereumChainSend({ ...deps, ...nonce })(params.symbol),
        });
    };
};
