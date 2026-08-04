import { useCallback } from 'react';

import { type CryptoId } from 'invity-api';

import { useServices } from '@suite-common/dependency-injection';
import { cryptoIdToNetwork } from '@suite-common/trading';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';

import { useTradingFindAccountOrToken } from './useTradingFindAccountOrToken';

/**
 * Get decimals for the given asset
 */
export function useTradingAssetDecimals(defaultDecimals?: number) {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const { getNetworkConfig } = networkConfigDeps;
    const resolvedDefaultDecimals = defaultDecimals ?? getNetworkConfig('btc').decimals;
    const findAccountOrToken = useTradingFindAccountOrToken();

    const getAssetDecimals = useCallback(
        ({ accountKey, cryptoId }: { accountKey?: AccountKey; cryptoId?: CryptoId }) => {
            if (!accountKey || !cryptoId) {
                return resolvedDefaultDecimals;
            }

            const accountOrToken = findAccountOrToken.current({ accountKey, cryptoId });
            const network = cryptoIdToNetwork(networkConfigDeps, cryptoId);
            const fallbackDecimals = network?.decimals ?? resolvedDefaultDecimals;

            if (!accountOrToken) {
                return fallbackDecimals;
            }

            const { token, account } = accountOrToken;

            if (token) {
                return token.decimals ?? fallbackDecimals;
            }

            return getNetworkConfig(account.symbol).decimals ?? fallbackDecimals;
        },
        [findAccountOrToken, getNetworkConfig, networkConfigDeps, resolvedDefaultDecimals],
    );

    return { getAssetDecimals };
}
