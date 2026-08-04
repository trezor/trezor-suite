import { useMemo } from 'react';

import { type CryptoId } from 'invity-api';

import { useServices } from '@suite-common/dependency-injection';
import {
    type TradingAssetSellOption,
    createAssetNativeTokenOption,
    useTradingAssets,
} from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';
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
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
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

        const { account: selectedAccount, token } = accountOrToken;

        if (token) {
            return {
                ...resolveAssetTokenOption(selectedAccount.symbol, token),
                accountKey: selectedAccount.key,
            } satisfies TradingAssetSellOption;
        }

        return {
            ...createAssetNativeTokenOption(
                networkConfigDeps,
                selectedAccount.symbol as NetworkSymbol,
            ),
            accountKey: selectedAccount.key,
        } satisfies TradingAssetSellOption;
    }, [accountOrToken, resolveAssetTokenOption]);

    return { account, defaultAsset };
}
