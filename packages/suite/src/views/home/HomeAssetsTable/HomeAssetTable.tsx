import { useCallback, useState } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import {
    HOME_ASSET_ROW_LIMIT,
    getHomeAssetRowLimit,
    selectAreHomeAssetSmallBalancesDisplayed,
    selectDisplayedNetworkSymbols,
    selectDisplayedWalletAssetKeys,
    selectHasShownWalletAssets,
    selectHomeAssetGrouping,
    selectIsHomeAssetTableFoldable,
    selectSmallBalanceSummary,
} from '@suite-common/assets';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    setAreHomeAssetSmallBalancesShown,
    setHomeAssetsTableGrouping,
} from '@suite-common/wallet-core';
import { type HomeAssetsTableGrouping } from '@suite-common/wallet-types';
import { Card, Table } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useDiscovery, useSelector } from '#src/hooks/suite';

import { AssetRowsSkeleton } from './AssetRowsSkeleton';
import { HomeAssetExpandRow } from './HomeAssetExpandRow';
import { HomeAssetNetworkSection } from './HomeAssetNetworkSection';
import { HomeAssetNewBanner } from './HomeAssetNewBanner';
import { HomeAssetRow } from './HomeAssetRow';
import { HomeAssetSmallBalancesHiddenRow } from './HomeAssetSmallBalancesHiddenRow';
import { HomeAssetTableEmptyState } from './HomeAssetTableEmptyState';
import { HomeAssetTableFilterHeader } from './HomeAssetTableFilter';
import { HOME_ASSET_CELL_PADDING, HOME_ASSET_COL_WIDTHS } from './homeAssetTableLayout';

const NO_NETWORKS: readonly NetworkSymbol[] = [];

export const HomeAssetTable = () => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const [isExpanded, setIsExpanded] = useState(false);
    const grouping = useSelector(selectHomeAssetGrouping);
    const areSmallBalancesShown = useSelector(selectAreHomeAssetSmallBalancesDisplayed);
    const smallBalances = useSelector(selectSmallBalanceSummary);
    const hasAssets = useSelector(selectHasShownWalletAssets);
    const { isDiscoveryRunning } = useDiscovery();
    const isFoldable = useSelector(state =>
        selectIsHomeAssetTableFoldable(state, HOME_ASSET_ROW_LIMIT),
    );

    const rowLimit = getHomeAssetRowLimit({ isFoldable, isExpanded });

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

    const changeSmallBalances = useCallback(
        (areShown: boolean) => {
            analytics.report({
                type: events.dashboardAssetListMenuEvent.name,
                payload: { type: 'show-small-balances', value: areShown },
            });
            // Turning them on while the table is folded would otherwise change nothing on screen.
            if (areShown) {
                setIsExpanded(true);
            }
            dispatch(setAreHomeAssetSmallBalancesShown(areShown));
        },
        [analytics, dispatch],
    );

    const openHiddenTokens = useCallback(() => {
        analytics.report({
            type: events.navigateFlowEvent.name,
            payload: { action: 'navigate', type: 'hidden-tokens', from: 'dashboard' },
        });
        dispatch(gotoThunk({ routeName: 'suite-hidden-tokens' }));
    }, [analytics, dispatch]);

    if (!hasAssets && isDiscoveryRunning) {
        return <AssetRowsSkeleton data-testid="@dashboard/home-asset-table/loading" />;
    }

    return (
        <Card paddingType="none" data-testid="@dashboard/home-asset-table">
            <HomeAssetNewBanner />
            <Table isRowHighlightedOnHover colWidths={HOME_ASSET_COL_WIDTHS}>
                <Table.Header>
                    <Table.Row>
                        <Table.Cell padding={HOME_ASSET_CELL_PADDING.first}>
                            <HomeAssetTableFilterHeader
                                grouping={grouping}
                                areSmallBalancesShown={areSmallBalancesShown}
                                smallBalances={smallBalances}
                                onGroupingChange={changeGrouping}
                                onSmallBalancesChange={changeSmallBalances}
                                onOpenHiddenTokens={openHiddenTokens}
                            />
                        </Table.Cell>
                        <Table.Cell align="end">
                            <Translation id="TR_EXCHANGE_RATE" />
                        </Table.Cell>
                        <Table.Cell align="end" padding={HOME_ASSET_CELL_PADDING.last}>
                            <Translation id="TR_BALANCE" />
                        </Table.Cell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {!hasAssets && <HomeAssetTableEmptyState />}
                    {hasAssets && assetKeys.length === 0 && (
                        <HomeAssetSmallBalancesHiddenRow
                            onShowSmallBalances={() => changeSmallBalances(true)}
                        />
                    )}
                    {grouping === 'networks'
                        ? networkSymbols.map(symbol => (
                              <HomeAssetNetworkSection
                                  key={symbol}
                                  symbol={symbol}
                                  rowLimit={rowLimit}
                              />
                          ))
                        : assetKeys.map(assetKey => (
                              <HomeAssetRow key={assetKey} assetKey={assetKey} />
                          ))}
                    {isFoldable && (
                        <HomeAssetExpandRow
                            isExpanded={isExpanded}
                            onToggle={() => {
                                analytics.report({
                                    type: events.dashboardAssetTableEvent.name,
                                    payload: { action: isExpanded ? 'show-less' : 'show-more' },
                                });
                                setIsExpanded(!isExpanded);
                            }}
                        />
                    )}
                </Table.Body>
            </Table>
        </Card>
    );
};
