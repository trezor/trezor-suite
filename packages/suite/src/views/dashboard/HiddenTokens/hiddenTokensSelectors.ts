import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    type AssetHolding,
    type HiddenAssetHoldings,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectEnabledNetworks,
    selectHiddenAssetHoldings,
    selectLastWeekFiatRates,
} from '@suite-common/wallet-core';
import { isCryptoDustAmount } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/device-utils';

import {
    type AssetFirstTableState,
    type AssetTotal,
    priceAssets,
    toAssetTotal,
} from '../AssetFirstTable/assetFirstTableSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetFirstTableState>();

const compareAssets = (left: AssetTotal, right: AssetTotal) =>
    right.cryptoBalance.comparedTo(left.cryptoBalance) ||
    left.displaySymbol.localeCompare(right.displaySymbol);

/** Nothing here can be priced, so how little of it there is decides what is dust. */
const isDust = (asset: AssetTotal) =>
    isCryptoDustAmount({
        cryptoBalance: asset.cryptoBalance,
        decimals: asset.tokenInfo?.decimals,
    });

const createHiddenAssetsSelector = (
    pick: (hidden: HiddenAssetHoldings) => readonly (readonly AssetHolding[])[],
) =>
    createMemoizedSelector(
        [
            selectHiddenAssetHoldings,
            selectEnabledNetworks,
            (_state: AssetFirstTableState, deviceState: StaticSessionId) => deviceState,
        ],
        (hidden, enabledNetworks, deviceState): readonly AssetTotal[] => {
            const assets = pick(hidden).flatMap(holdings => {
                const held = holdings.filter(
                    holding =>
                        holding.deviceState === deviceState &&
                        holding.isAccountVisible &&
                        enabledNetworks.includes(holding.symbol),
                );

                return toAssetTotal(held) ?? [];
            });

            return returnStableArrayIfEmpty(assets.sort(compareAssets));
        },
    );

const createHiddenTokensSelectors = (
    pick: (hidden: HiddenAssetHoldings) => readonly (readonly AssetHolding[])[],
) => {
    const selectAssets = createHiddenAssetsSelector(pick);

    return {
        selectAssets: createMemoizedSelector([selectAssets], assets =>
            returnStableArrayIfEmpty(assets.filter(asset => !isDust(asset))),
        ),
        // The rows themselves have no price, but what the dust adds up to is worth saying.
        selectDustRows: createMemoizedSelector(
            [selectAssets, selectCurrentFiatRates, selectLastWeekFiatRates, selectBaseCurrency],
            (assets, currentFiatRates, lastWeekFiatRates, baseCurrencyCode) =>
                priceAssets(
                    assets.filter(isDust),
                    currentFiatRates,
                    lastWeekFiatRates,
                    baseCurrencyCode,
                ),
        ),
    };
};

export const {
    selectAssets: selectHiddenByUserAssets,
    selectDustRows: selectHiddenByUserDustRows,
} = createHiddenTokensSelectors(hidden => hidden.hiddenByUser);

export const {
    selectAssets: selectUnrecognizedAssets,
    selectDustRows: selectUnrecognizedDustRows,
} = createHiddenTokensSelectors(hidden => hidden.unrecognized);
