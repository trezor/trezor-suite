import { useMemo } from 'react';
import { useThrottle } from 'react-use';

import { selectSupportedNetworkSymbols } from '@suite-common/networks';
import { selectVisibleDeviceAccountsWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { useFreshRef } from '@trezor/react-utils';

import { type AssetRowOption } from 'src/components/suite/asset-picker/types';
import { useSelector } from 'src/hooks/suite';

import { buildSellAssetRows } from '../utils/buildSellAssetRows';

export type UseSellAssetRowsProps = {
    networkSymbolFilter: NetworkSymbol | undefined;
};

export function useSellAssetRows({ networkSymbolFilter }: UseSellAssetRowsProps): {
    assetRows: AssetRowOption[];
    networks: NetworkSymbol[];
} {
    const accounts = useSelector(selectVisibleDeviceAccountsWithSuiteSyncLabel);
    const supportedNetworks = useSelector(selectSupportedNetworkSymbols);
    const fiatRates = useSelector(selectCurrentFiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const tokenDefinitions = useSelector(selectTokenDefinitions);

    // Accounts are constantly being updated in Redux. So throttle them to significantly reduce re-renders
    const throttledAccounts = useThrottle(accounts, 1000);

    const fiatRatesRef = useFreshRef(fiatRates);
    const hasFiatRates = fiatRates !== undefined;

    return useMemo(() => {
        const currentFiatRates = hasFiatRates ? fiatRatesRef.current : undefined;

        if (!currentFiatRates) {
            return { assetRows: [], networks: [] };
        }

        return buildSellAssetRows({
            supportedNetworks,
            accounts: throttledAccounts,
            networkSymbolFilter,
            tokenDefinitions,
            baseCurrencyCode,
            fiatRates: currentFiatRates,
        });
    }, [
        hasFiatRates,
        fiatRatesRef,
        throttledAccounts,
        networkSymbolFilter,
        tokenDefinitions,
        baseCurrencyCode,
        supportedNetworks,
    ]);
}
