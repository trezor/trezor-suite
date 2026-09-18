import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    type AssetHolding,
    type HiddenAssetHoldings,
    selectEnabledNetworks,
    selectHiddenAssetHoldings,
} from '@suite-common/wallet-core';
import { type StaticSessionId } from '@trezor/device-utils';

import {
    type AssetFirstTableState,
    type AssetTotal,
    toAssetTotal,
} from '../AssetFirstTable/assetFirstTableSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetFirstTableState>();

const compareAssets = (left: AssetTotal, right: AssetTotal) =>
    right.cryptoBalance.comparedTo(left.cryptoBalance) ||
    left.displaySymbol.localeCompare(right.displaySymbol);

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

export const selectHiddenByUserAssets = createHiddenAssetsSelector(hidden => hidden.hiddenByUser);

export const selectUnrecognizedAssets = createHiddenAssetsSelector(hidden => hidden.unrecognized);
