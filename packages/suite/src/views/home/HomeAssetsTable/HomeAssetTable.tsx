import { useCallback } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { AssetTableExpandRow, AssetTableFrame } from '@suite/assets';
import { gotoThunk } from '@suite/router';
import {
    ASSET_TABLE_ROW_LIMIT,
    selectAreAssetTableSmallBalancesDisplayed,
    selectDisplayedNetworkSymbols,
    selectDisplayedWalletAssetKeys,
    selectHasShownWalletAssets,
    selectHomeAssetGrouping,
    selectIsHomeAssetTableFoldable,
    selectSmallBalanceSummary,
} from '@suite-common/assets';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { setHomeAssetsTableGrouping } from '@suite-common/wallet-core';
import { type HomeAssetsTableGrouping } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { AssetTableFilterHeader } from '#src/components/wallet/assets/AssetTableFilter';
import { AssetTableSmallBalancesHiddenRow } from '#src/components/wallet/assets/AssetTableSmallBalancesHiddenRow';
import { useAssetTableFolding } from '#src/components/wallet/assets/useAssetTableFolding';
import { useDiscovery } from '#src/hooks/suite/useDiscovery';
import { useSelector } from '#src/hooks/suite/useSelector';

import { AssetRowsSkeleton } from './AssetRowsSkeleton';
import { HomeAssetNetworkSection } from './HomeAssetNetworkSection';
import { HomeAssetNewBanner } from './HomeAssetNewBanner';
import { HomeAssetRowContainer } from './HomeAssetRowContainer';
import { HomeAssetTableEmptyState } from './HomeAssetTableEmptyState';

const NO_NETWORKS: readonly NetworkSymbol[] = [];

export const HomeAssetTable = () => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const grouping = useSelector(selectHomeAssetGrouping);
    const areSmallBalancesShown = useSelector(selectAreAssetTableSmallBalancesDisplayed);
    const smallBalances = useSelector(selectSmallBalanceSummary);
    const hasAssets = useSelector(selectHasShownWalletAssets);
    const { isDiscoveryRunning } = useDiscovery();
    const isFoldable = useSelector(state =>
        selectIsHomeAssetTableFoldable(state, ASSET_TABLE_ROW_LIMIT),
    );

    const { isExpanded, rowLimit, toggleExpanded, changeSmallBalances } = useAssetTableFolding({
        isFoldable,
    });

    const assetKeys = useSelector(state => selectDisplayedWalletAssetKeys(state, rowLimit));
    const networkSymbols = useSelector(state =>
        grouping === 'networks' ? selectDisplayedNetworkSymbols(state, rowLimit) : NO_NETWORKS,
    );

    const changeGrouping = useCallback(
        (chosen: HomeAssetsTableGrouping) => {
            if (chosen !== grouping) {
                analytics.report({
                    type: events.dashboardAssetListMenuEvent.name,
                    payload: {
                        type: 'grouping',
                        value: chosen === 'networks' ? 'by-networks' : 'default',
                    },
                });
            }
            dispatch(setHomeAssetsTableGrouping(chosen));
        },
        [analytics, dispatch, grouping],
    );

    // Only the menu's switch is reported; the row that brings small balances back is not.
    const changeSmallBalancesInMenu = (areShown: boolean) => {
        analytics.report({
            type: events.dashboardAssetListMenuEvent.name,
            payload: { type: 'show-small-balances', value: areShown },
        });
        changeSmallBalances(areShown);
    };

    const openHiddenTokens = () => {
        analytics.report({
            type: events.navigateFlowEvent.name,
            payload: { action: 'navigate', type: 'hidden-tokens', from: 'dashboard' },
        });
        dispatch(gotoThunk({ routeName: 'suite-hidden-tokens' }));
    };

    if (!hasAssets && isDiscoveryRunning) {
        return <AssetRowsSkeleton data-testid="@dashboard/home-asset-table/loading" />;
    }

    return (
        <AssetTableFrame
            banner={<HomeAssetNewBanner />}
            assetHeader={
                <AssetTableFilterHeader
                    grouping={grouping}
                    areSmallBalancesShown={areSmallBalancesShown}
                    smallBalances={smallBalances}
                    onGroupingChange={changeGrouping}
                    onSmallBalancesChange={changeSmallBalancesInMenu}
                    onOpenHiddenTokens={openHiddenTokens}
                />
            }
            data-testid="@dashboard/home-asset-table"
        >
            {!hasAssets && <HomeAssetTableEmptyState />}
            {hasAssets && assetKeys.length === 0 && (
                <AssetTableSmallBalancesHiddenRow
                    onShowSmallBalances={() => changeSmallBalances(true)}
                />
            )}
            {grouping === 'networks'
                ? networkSymbols.map(symbol => (
                      <HomeAssetNetworkSection key={symbol} symbol={symbol} rowLimit={rowLimit} />
                  ))
                : assetKeys.map(assetKey => (
                      <HomeAssetRowContainer key={assetKey} assetKey={assetKey} />
                  ))}
            {isFoldable && (
                <AssetTableExpandRow
                    isExpanded={isExpanded}
                    onToggle={() => {
                        analytics.report({
                            type: events.dashboardAssetTableEvent.name,
                            payload: { action: isExpanded ? 'show-less' : 'show-more' },
                        });
                        toggleExpanded();
                    }}
                />
            )}
        </AssetTableFrame>
    );
};
