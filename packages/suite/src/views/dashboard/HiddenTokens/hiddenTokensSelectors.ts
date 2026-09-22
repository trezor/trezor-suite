import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    type HiddenTokenReason,
    selectEnabledNetworks,
    selectHiddenTokenReasons,
} from '@suite-common/wallet-core';
import { isCryptoDustAmount } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/device-utils';

import {
    type AssetAccounts,
    type HomeAssetTableState,
    asAsset,
    selectDeviceAssetGroups,
} from '../HomeAssetTable/homeAssetTableSelectors';
import { getAssetDisplaySymbol, sumAssetAccounts } from '../HomeAssetTable/homeAssetTableUtils';

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

const describeAsset = (assetAccounts: AssetAccounts) => {
    const { cryptoBalance, tokenInfo } = sumAssetAccounts(assetAccounts);
    const [{ symbol }] = assetAccounts;

    return {
        assetAccounts,
        cryptoBalance,
        tokenInfo,
        displaySymbol: getAssetDisplaySymbol({ symbol, tokenInfo }),
    };
};

const createHiddenAssetsSelector = (reason: HiddenTokenReason) =>
    createMemoizedSelector(
        [
            (state: HomeAssetTableState, deviceState: StaticSessionId) =>
                selectDeviceAssetGroups(state, deviceState, selectEnabledNetworks(state)),
            selectHiddenTokenReasons,
        ],
        (assetGroups, reasons): readonly AssetAccounts[] => {
            const assets = assetGroups.flatMap(assetAccounts => {
                const [assetAccount] = assetAccounts;

                if (
                    assetAccount?.contractAddress === undefined ||
                    reasons.get(assetAccount.symbol)?.get(assetAccount.contractAddress) !== reason
                ) {
                    return [];
                }

                const shown = asAsset(assetAccounts.filter(held => held.isAccountVisible));
                const asset = shown === undefined ? undefined : describeAsset(shown);

                if (
                    asset === undefined ||
                    isCryptoDustAmount({
                        cryptoBalance: asset.cryptoBalance,
                        decimals: asset.tokenInfo?.decimals,
                    })
                ) {
                    return [];
                }

                return [asset];
            });

            assets.sort(
                (left, right) =>
                    right.cryptoBalance.comparedTo(left.cryptoBalance) ||
                    left.displaySymbol.localeCompare(right.displaySymbol),
            );

            return returnStableArrayIfEmpty(assets.map(asset => asset.assetAccounts));
        },
    );

export const selectHiddenByUserAssets = createHiddenAssetsSelector('hiddenByUser');

export const selectUnrecognizedAssets = createHiddenAssetsSelector('unrecognized');
