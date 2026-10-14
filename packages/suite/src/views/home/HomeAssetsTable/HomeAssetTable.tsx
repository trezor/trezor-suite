import { useCallback, useState } from 'react';

import { Translation } from '@suite/intl';
import {
    selectDisplayedNetworkSymbols,
    selectDisplayedWalletAssetKeys,
    selectHasShownWalletAssets,
    selectIsHomeAssetTableFoldable,
} from '@suite-common/assets';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectAreHomeAssetSmallBalancesShown,
    selectHomeAssetsTableGrouping,
    setAreHomeAssetSmallBalancesShown,
    setHomeAssetsTableGrouping,
} from '@suite-common/wallet-core';
import { type HomeAssetsTableGrouping } from '@suite-common/wallet-types';
import { Card, Table } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';

import { HomeAssetExpandRow } from './HomeAssetExpandRow';
import { HomeAssetNetworkSection } from './HomeAssetNetworkSection';
import { HomeAssetNewBanner } from './HomeAssetNewBanner';
import { HomeAssetRow } from './HomeAssetRow';
import { HomeAssetTableFilterHeader } from './HomeAssetTableFilter';
import { HOME_ASSET_CELL_PADDING, HOME_ASSET_COL_WIDTHS } from './homeAssetTableLayout';

const NO_NETWORKS: readonly NetworkSymbol[] = [];
/** How many rows the table shows before it folds; mobile picks its own. */
const HOME_ASSET_ROW_LIMIT = 8;

export const HomeAssetTable = () => {
    const { dispatch } = useServices(injectDispatch);
    const [isExpanded, setIsExpanded] = useState(false);
    const grouping = useSelector(selectHomeAssetsTableGrouping);
    const areSmallBalancesShown = useSelector(selectAreHomeAssetSmallBalancesShown);
    const hasAssets = useSelector(selectHasShownWalletAssets);
    const isFoldable = useSelector(state =>
        selectIsHomeAssetTableFoldable(state, HOME_ASSET_ROW_LIMIT),
    );

    const rowLimit = isFoldable && !isExpanded ? HOME_ASSET_ROW_LIMIT : undefined;

    const assetKeys = useSelector(state => selectDisplayedWalletAssetKeys(state, rowLimit));
    const networkSymbols = useSelector(state =>
        grouping === 'networks' ? selectDisplayedNetworkSymbols(state, rowLimit) : NO_NETWORKS,
    );

    const changeGrouping = useCallback(
        (chosen: HomeAssetsTableGrouping) => {
            dispatch(setHomeAssetsTableGrouping(chosen));
        },
        [dispatch],
    );

    const changeSmallBalances = useCallback(
        (areShown: boolean) => {
            // Turning them on while the table is folded would otherwise change nothing on screen.
            if (areShown) {
                setIsExpanded(true);
            }
            dispatch(setAreHomeAssetSmallBalancesShown(areShown));
        },
        [dispatch],
    );

    if (!hasAssets) {
        return null;
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
                                onGroupingChange={changeGrouping}
                                onSmallBalancesChange={changeSmallBalances}
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
                            onToggle={() => setIsExpanded(!isExpanded)}
                        />
                    )}
                </Table.Body>
            </Table>
        </Card>
    );
};
