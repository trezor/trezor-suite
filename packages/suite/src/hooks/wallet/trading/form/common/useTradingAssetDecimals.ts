import { useCallback } from 'react';

import { type CryptoId } from 'invity-api';

import { cryptoIdToNetwork } from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';

import { useTradingFindAccountOrToken } from './useTradingFindAccountOrToken';

/**
 * Get decimals for the given asset
 */
export function useTradingAssetDecimals(defaultDecimals = getNetwork('btc').decimals) {
    const findAccountOrToken = useTradingFindAccountOrToken();

    const getAssetDecimals = useCallback(
        ({ accountKey, cryptoId }: { accountKey?: AccountKey; cryptoId?: CryptoId }) => {
            if (!accountKey || !cryptoId) {
                return defaultDecimals;
            }

            const accountOrToken = findAccountOrToken.current({ accountKey, cryptoId });
            const network = cryptoIdToNetwork(cryptoId);
            const fallbackDecimals = network?.decimals ?? defaultDecimals;

            if (!accountOrToken) {
                return fallbackDecimals;
            }

            const { token, account } = accountOrToken;

            if (token) {
                return token.decimals ?? fallbackDecimals;
            }

            return getNetwork(account.symbol).decimals ?? fallbackDecimals;
        },
        [defaultDecimals, findAccountOrToken],
    );

    return { getAssetDecimals };
}
