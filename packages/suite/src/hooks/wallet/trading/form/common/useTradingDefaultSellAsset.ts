import { useMemo } from 'react';

import { type CryptoId } from 'invity-api';

import {
    type TradingAssetSellOption,
    createAssetNativeTokenOption,
    useTradingAssets,
} from '@suite-common/trading';
import { isNetworkSymbolNonTestnet } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';

import { useTradingFindAccountOrToken } from './useTradingFindAccountOrToken';

export interface UseTradingDefaultSellAssetProps {
    accountKey?: AccountKey;
    cryptoId?: CryptoId;
}

/**
 * Based on `accountKey` and `cryptoId` find corresponding account or its token and create default asset option or fallback to default crypto currency.
 */
export function useTradingDefaultSellAsset({
    accountKey,
    cryptoId,
}: UseTradingDefaultSellAssetProps) {
    const findAccountOrToken = useTradingFindAccountOrToken();
    const { resolveAssetTokenOption } = useTradingAssets();
    const accountOrToken = useMemo(() => {
        if (!cryptoId || !accountKey) {
            return null;
        }

        return findAccountOrToken.current({ accountKey, cryptoId });
    }, [findAccountOrToken, accountKey, cryptoId]);
    const account = accountOrToken?.account ?? null;

    const defaultAsset: TradingAssetSellOption | undefined = useMemo(() => {
        if (!accountOrToken) {
            return undefined;
        }

        const { account, token } = accountOrToken;
        if (!isNetworkSymbolNonTestnet(account.symbol)) {
            return undefined;
        }

        if (token) {
            return {
                ...resolveAssetTokenOption(account.symbol, token),
                accountKey: account.key,
            } satisfies TradingAssetSellOption;
        }

        return {
            ...createAssetNativeTokenOption(account.symbol),
            accountKey: account.key,
        } satisfies TradingAssetSellOption;
    }, [accountOrToken, resolveAssetTokenOption]);

    return { account, defaultAsset };
}
