import { useMemo } from 'react';

import { usePreferredCurrencyUsdThreshold } from '@suite-common/trading';
import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { useCurrentRef } from '@trezor/react-utils';

import { type AccountWithTokensOption } from 'src/components/suite/asset-picker/types';
import { useSelector } from 'src/hooks/suite';

import { useAssetsContext } from '../../../TradingFormInputAssetPicker';
import { type AssetGroupKey, buildGroupedAssetOptions } from '../utils/buildGroupedAssetOptions';

export function useGroupedAssetOptions(
    assetRows: AccountWithTokensOption[],
    expandedGroupKeys: AssetGroupKey[],
) {
    const { includedCryptoIds } = useAssetsContext();
    const fiatRates = useSelector(selectCurrentFiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const threshold = usePreferredCurrencyUsdThreshold();

    const fiatRatesRef = useCurrentRef(fiatRates);

    return useMemo(
        () =>
            buildGroupedAssetOptions({
                assetRows,
                tradableCryptoIds: includedCryptoIds,
                threshold,
                fiatRates: fiatRatesRef.current,
                baseCurrencyCode,
                expandedGroupKeys,
            }),
        [
            assetRows,
            includedCryptoIds,
            threshold,
            fiatRatesRef,
            baseCurrencyCode,
            expandedGroupKeys,
        ],
    );
}
