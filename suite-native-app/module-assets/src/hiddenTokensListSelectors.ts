import { type HomeAssetTableState, selectHiddenWalletAssetKeys } from '@suite-common/assets';
import { type HiddenTokenReason, type WalletAssetKey } from '@suite-common/wallet-core';
import { createWeakMapSelector } from '@trezor/redux-utils';

export type HiddenTokensListEntry =
    | { type: 'section-header'; reason: HiddenTokenReason }
    | { type: 'asset'; assetKey: WalletAssetKey };

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

const toSectionEntries = (
    reason: HiddenTokenReason,
    assetKeys: readonly WalletAssetKey[],
): HiddenTokensListEntry[] =>
    assetKeys.length > 0
        ? [
              { type: 'section-header', reason },
              ...assetKeys.map(assetKey => ({ type: 'asset' as const, assetKey })),
          ]
        : [];

export const selectHiddenTokensListEntries = createMemoizedSelector(
    [
        (state: HomeAssetTableState) => selectHiddenWalletAssetKeys(state, 'hiddenByUser'),
        (state: HomeAssetTableState) => selectHiddenWalletAssetKeys(state, 'unrecognized'),
    ],
    (hiddenByUserAssetKeys, unrecognizedAssetKeys): readonly HiddenTokensListEntry[] => [
        ...toSectionEntries('hiddenByUser', hiddenByUserAssetKeys),
        ...toSectionEntries('unrecognized', unrecognizedAssetKeys),
    ],
);
