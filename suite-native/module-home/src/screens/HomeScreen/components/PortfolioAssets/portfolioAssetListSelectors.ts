import {
    type HomeAssetTableState,
    selectCappedAssetKeysByNetwork,
    selectDisplayedNetworkSymbols,
    selectDisplayedWalletAssetKeys,
} from '@suite-common/assets';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAssetKey, selectHomeAssetsTableGrouping } from '@suite-common/wallet-core';
import { createWeakMapSelector } from '@trezor/redux-utils';
import { exhaustive } from '@trezor/type-utils';

export type PortfolioAssetListEntry =
    | { type: 'network'; symbol: NetworkSymbol }
    | { type: 'asset'; assetKey: WalletAssetKey; isInNetworkGroup: boolean };

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

const toAssetEntries = (
    assetKeys: readonly WalletAssetKey[],
    isInNetworkGroup: boolean,
): PortfolioAssetListEntry[] =>
    assetKeys.map(assetKey => ({ type: 'asset', assetKey, isInNetworkGroup }));

export const selectPortfolioAssetListEntries = createMemoizedSelector(
    [
        selectHomeAssetsTableGrouping,
        selectDisplayedWalletAssetKeys,
        selectDisplayedNetworkSymbols,
        selectCappedAssetKeysByNetwork,
    ],
    (
        grouping,
        assetKeys,
        networkSymbols,
        assetKeysByNetwork,
    ): readonly PortfolioAssetListEntry[] => {
        switch (grouping) {
            case 'default':
                return toAssetEntries(assetKeys, false);
            case 'networks':
                return networkSymbols.flatMap((symbol): PortfolioAssetListEntry[] => [
                    { type: 'network', symbol },
                    ...toAssetEntries(assetKeysByNetwork.get(symbol) ?? [], true),
                ]);
            default:
                return exhaustive(grouping);
        }
    },
);
