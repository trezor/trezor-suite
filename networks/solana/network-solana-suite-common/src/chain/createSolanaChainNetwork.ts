import {
    ChainNetworkError,
    type CreateChainNetwork,
    type FetchCoinGeckoCurrentRateDep,
    type FetchConnectAccountBalanceDeps,
    buildConnectChainNetwork,
    createFetchConnectAccountBalance,
} from '@trezor/network-module-suite-common-types';
import { type SolanaNetworkSymbol, isSupportedSolanaNetwork } from '@trezor/network-solana-types';

import { getAccountSyncInterval, getNetworkConfig } from '../networkConfig';

export type SolanaChainNetworkDeps = FetchConnectAccountBalanceDeps & FetchCoinGeckoCurrentRateDep;

/** Solana network served by its RPC backend, which quotes no rates. */
export const createSolanaChainNetwork = (deps: SolanaChainNetworkDeps): CreateChainNetwork => {
    const fetchAccountBalance = createFetchConnectAccountBalance(deps);

    return params => {
        if (!isSupportedSolanaNetwork(params.symbol)) {
            throw new ChainNetworkError('unsupported-network', params.symbol);
        }

        const solanaSymbol: SolanaNetworkSymbol = params.symbol;
        const config = getNetworkConfig(solanaSymbol);

        return buildConnectChainNetwork({
            params,
            decimals: config.decimals,
            accountSyncIntervalMs: getAccountSyncInterval(solanaSymbol),
            displayBalance: 'availableBalance',
            useConnectionIdentity: false,
            fetchAccountBalance,
            fetchFiatRate: config.testnet ? null : deps.fetchCoinGeckoCurrentRate,
        });
    };
};
