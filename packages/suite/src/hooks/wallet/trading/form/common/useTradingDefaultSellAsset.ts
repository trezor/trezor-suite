import { useMemo } from 'react';

import { CryptoId } from 'invity-api';

import {
    TradingAssetSellOption,
    createAssetNativeTokenOption,
    createAssetTokenOption,
} from '@suite-common/trading';
import { NetworkConfigWithoutTestnets } from '@suite-common/wallet-config';
import { AccountKey } from '@suite-common/wallet-types';

import { useTradingFindAccountOrToken } from './useTradingFindAccountOrToken';

export interface UseTradingDefaultSellAssetProps {
    tradingAccountKey: AccountKey;
    cryptoId: CryptoId;
}

/**
 * Based on `tradingAccountKey` and `cryptoId` find corresponding account or its token and create default asset option or fallback to default crypto currency.
 */
export function useTradingDefaultSellAsset({
    tradingAccountKey,
    cryptoId,
}: UseTradingDefaultSellAssetProps) {
    const findAccountOrToken = useTradingFindAccountOrToken();
    const accountOrToken = useMemo(
        () => findAccountOrToken.current({ tradingAccountKey, cryptoId }),
        [findAccountOrToken, tradingAccountKey, cryptoId],
    );
    const account = accountOrToken?.account ?? null;

    const defaultAsset: TradingAssetSellOption | undefined = useMemo(() => {
        if (!accountOrToken) {
            return undefined;
        }

        const { account, token } = accountOrToken;

        if (token) {
            return {
                ...createAssetTokenOption(account.symbol, token),
                accountKey: account.key,
            } satisfies TradingAssetSellOption;
        }

        return {
            ...createAssetNativeTokenOption(
                account.symbol as NetworkConfigWithoutTestnets['symbol'],
            ),
            accountKey: account.key,
        } satisfies TradingAssetSellOption;
    }, [accountOrToken]);

    return { account, defaultAsset };
}
