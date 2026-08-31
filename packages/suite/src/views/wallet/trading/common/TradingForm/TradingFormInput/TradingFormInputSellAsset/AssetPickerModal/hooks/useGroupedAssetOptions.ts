import { useMemo } from 'react';

import { useSelector } from '@suite-common/redux-utils';
import { usePreferredCurrencyUsdThreshold } from '@suite-common/trading';
import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { useFreshRef } from '@trezor/react-utils';

import { type AccountWithTokensOption } from 'src/components/suite/asset-picker/types';
import { type AssetGroupKey } from 'src/components/suite/asset-picker/utils/assetGroupKey';

import { useAssetsContext } from '../../../TradingFormInputAssetPicker';
import { buildGroupedAssetOptions } from '../utils/buildGroupedAssetOptions';

export function useGroupedAssetOptions(
    assetRows: AccountWithTokensOption[],
    expandedGroupKeys: AssetGroupKey[],
) {
    const { includedCryptoIds } = useAssetsContext();
    const fiatRates = useSelector(selectCurrentFiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const threshold = usePreferredCurrencyUsdThreshold();

    const fiatRatesRef = useFreshRef(fiatRates);
    const hasFiatRates = fiatRates !== undefined;

    return useMemo(
        () =>
            buildGroupedAssetOptions({
                assetRows,
                tradableCryptoIds: includedCryptoIds,
                threshold,
                fiatRates: hasFiatRates ? fiatRatesRef.current : undefined,
                baseCurrencyCode,
                expandedGroupKeys,
            }),
        [
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
