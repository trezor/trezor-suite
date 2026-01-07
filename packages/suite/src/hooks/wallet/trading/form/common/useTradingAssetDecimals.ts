import { useCallback } from 'react';

import { CryptoId } from 'invity-api';

import { cryptoIdToNetwork } from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { AccountKey } from '@suite-common/wallet-types';

import { useTradingFindAccountOrToken } from './useTradingFindAccountOrToken';

/**
 * Get decimals for the given asset
 */
export function useTradingAssetDecimals(defaultDecimals = 8) {
    const findAccountOrToken = useTradingFindAccountOrToken();

    const getAssetDecimals = useCallback(
        ({
            tradingAccountKey,
            cryptoId,
        }: {
            tradingAccountKey?: AccountKey;
            cryptoId?: CryptoId;
        }) => {
            if (!tradingAccountKey || !cryptoId) {
                return defaultDecimals;
            }

            const accountOrToken = findAccountOrToken.current({ tradingAccountKey, cryptoId });
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
