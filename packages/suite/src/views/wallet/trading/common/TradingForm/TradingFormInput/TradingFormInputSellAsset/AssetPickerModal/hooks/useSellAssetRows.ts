import { useMemo } from 'react';
import { useThrottle } from 'react-use';

import { type CryptoId } from 'invity-api';

import { selectSelectedDevice } from '@suite-common/device';
import { selectAccountsWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { useCurrentRef } from '@trezor/react-utils';

import { type AssetRowOption } from 'src/components/suite/asset-picker/types';
import { useSelector } from 'src/hooks/suite';

import { buildSellAssetRows } from '../utils/buildSellAssetRows';

export interface UseSellAssetRowsProps {
    networkSymbolFilter: NetworkSymbol | undefined;
    excludedCryptoIds: Set<CryptoId>;
}

export function useSellAssetRows({
    networkSymbolFilter,
    excludedCryptoIds,
}: UseSellAssetRowsProps): {
    assetRows: AssetRowOption[];
    networks: NetworkSymbol[];
} {
    const device = useSelector(selectSelectedDevice);
    const baseAccounts = useSelector(selectVisibleDeviceAccounts);

    const accounts = useSelector(state =>
        selectAccountsWithSuiteSyncLabel(
            state,
            baseAccounts,
            device?.state?.staticSessionId ?? null,
        ),
    );

    const fiatRates = useSelector(selectCurrentFiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const tokenDefinitions = useSelector(selectTokenDefinitions);

    // Accounts are constantly being updated in Redux. So throttle them to significantly reduce re-renders
    const throttledAccounts = useThrottle(accounts, 1000);
    const fiatRatesRef = useCurrentRef(fiatRates);

    return useMemo(() => {
        const currentFiatRates = fiatRatesRef.current;

        if (!currentFiatRates) {
            return { assetRows: [], networks: [] };
        }

        return buildSellAssetRows({
            accounts: throttledAccounts,
            networkSymbolFilter,
            excludedCryptoIds,
            tokenDefinitions,
            baseCurrencyCode,
            fiatRates: currentFiatRates,
        });
    }, [
        fiatRatesRef,
        throttledAccounts,
        networkSymbolFilter,
        excludedCryptoIds,
        tokenDefinitions,
        baseCurrencyCode,
    ]);
}
