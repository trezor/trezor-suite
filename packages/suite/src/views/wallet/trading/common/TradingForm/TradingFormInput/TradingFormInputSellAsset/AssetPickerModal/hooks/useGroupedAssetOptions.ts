import { useMemo } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkConfigDeps } from '@suite-common/networks';
import { usePreferredCurrencyUsdThreshold } from '@suite-common/trading';
import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { useFreshRef } from '@trezor/react-utils';

import { type AccountWithTokensOption } from 'src/components/suite/asset-picker/types';
import { type AssetGroupKey } from 'src/components/suite/asset-picker/utils/assetGroupKey';
import { useSelector } from 'src/hooks/suite';

import { useAssetsContext } from '../../../TradingFormInputAssetPicker';
import { buildGroupedAssetOptions } from '../utils/buildGroupedAssetOptions';

export function useGroupedAssetOptions(
    assetRows: AccountWithTokensOption[],
    expandedGroupKeys: AssetGroupKey[],
) {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const { includedCryptoIds } = useAssetsContext();
    const fiatRates = useSelector(selectCurrentFiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const threshold = usePreferredCurrencyUsdThreshold();

    const fiatRatesRef = useFreshRef(fiatRates);
    const hasFiatRates = fiatRates !== undefined;

    return useMemo(
        () =>
            buildGroupedAssetOptions(networkConfigDeps, {
                assetRows,
                tradableCryptoIds: includedCryptoIds,
                threshold,
                fiatRates: hasFiatRates ? fiatRatesRef.current : undefined,
                baseCurrencyCode,
                expandedGroupKeys,
            }),
        [
            networkConfigDeps,
            assetRows,
            includedCryptoIds,
            threshold,
            hasFiatRates,
            fiatRatesRef,
            baseCurrencyCode,
            expandedGroupKeys,
        ],
    );
}
