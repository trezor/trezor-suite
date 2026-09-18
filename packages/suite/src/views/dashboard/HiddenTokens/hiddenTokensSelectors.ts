import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type AssetHolding,
    type HiddenAssetHoldings,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectEnabledNetworks,
    selectHiddenAssetHoldings,
    selectLastWeekFiatRates,
} from '@suite-common/wallet-core';
import { type StaticSessionId } from '@trezor/device-utils';

import {
    type AssetFirstTableState,
    priceAssets,
    toAssetTotal,
} from '../AssetFirstTable/assetFirstTableSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetFirstTableState>();

const createHiddenRowsSelector = (
    pick: (hidden: HiddenAssetHoldings) => readonly (readonly AssetHolding[])[],
) =>
    createMemoizedSelector(
        [
            selectHiddenAssetHoldings,
            selectEnabledNetworks,
            selectCurrentFiatRates,
            selectLastWeekFiatRates,
            selectBaseCurrency,
            (_state: AssetFirstTableState, deviceState: StaticSessionId) => deviceState,
        ],
        (
            hidden,
            enabledNetworks,
            currentFiatRates,
            lastWeekFiatRates,
            baseCurrencyCode,
            deviceState,
        ) => {
            const assets = pick(hidden).flatMap(holdings => {
                const held = holdings.filter(
                    holding =>
                        holding.deviceState === deviceState &&
                        holding.isAccountVisible &&
                        enabledNetworks.includes(holding.symbol),
                );

                return toAssetTotal(held) ?? [];
            });

            return priceAssets(assets, currentFiatRates, lastWeekFiatRates, baseCurrencyCode);
        },
    );

export const selectHiddenByUserAssetRows = createHiddenRowsSelector(hidden => hidden.hiddenByUser);

export const selectUnrecognizedAssetRows = createHiddenRowsSelector(hidden => hidden.unrecognized);
