import {
    type CreateChainNetwork,
    type FetchCoinGeckoCurrentRateDep,
    type FetchConnectAccountBalanceDeps,
    buildConnectChainNetwork,
    createFetchConnectAccountBalance,
    readChainNetworkConfig,
} from '@trezor/network-module-suite-common-types';
import { isSupportedRippleNetwork } from '@trezor/network-ripple-types';

import { getAccountSyncInterval, getNetworkConfig } from '../networkConfig';

export type RippleChainNetworkDeps = FetchConnectAccountBalanceDeps & FetchCoinGeckoCurrentRateDep;

/**
 * XRP Ledger network. The ledger holds back a reserve from every account, so the user sees the
 * full balance. Tokens are not read: the backend does not report them.
 */
export const createRippleChainNetwork = (deps: RippleChainNetworkDeps): CreateChainNetwork => {
    const fetchAccountBalance = createFetchConnectAccountBalance(deps);

    return params => {
        const config = readChainNetworkConfig(
            {
                isSupportedNetwork: isSupportedRippleNetwork,
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
            displayBalance: 'balance',
            useConnectionIdentity: false,
            fetchAccountBalance,
            fetchFiatRate: rateSource,
        });
    };
};
