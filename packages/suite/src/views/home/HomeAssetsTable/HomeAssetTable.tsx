import { useCallback, useState } from 'react';

import { Translation } from '@suite/intl';
import {
    HOME_ASSET_ROW_LIMIT,
    selectDisplayedWalletAssetKeys,
    selectShownNetworkSymbols,
    selectShownWalletAssetKeys,
} from '@suite-common/assets';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectAreHomeAssetSmallBalancesShown,
    selectHomeAssetsTableGrouping,
    setHomeAssetsTableGrouping,
    showHomeAssetSmallBalances,
} from '@suite-common/wallet-core';
import { type HomeAssetsTableGrouping } from '@suite-common/wallet-types';
import { Card, Table } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { HomeAssetExpandRow } from './HomeAssetExpandRow';
import { HomeAssetNetworkSection } from './HomeAssetNetworkSection';
import { HomeAssetNewBanner } from './HomeAssetNewBanner';
import { HomeAssetRow } from './HomeAssetRow';
import { HomeAssetTableFilterHeader } from './HomeAssetTableFilter';
import { HOME_ASSET_CELL_PADDING, HOME_ASSET_COL_WIDTHS } from './homeAssetTableLayout';
import { useSmallBalanceThresholdRates } from './useSmallBalanceThresholdRates';

const NO_NETWORKS: readonly NetworkSymbol[] = [];

export const HomeAssetTable = () => {
    const { dispatch } = useServices(injectDispatch);
    const [isExpanded, setIsExpanded] = useState(false);
    useSmallBalanceThresholdRates();
    const grouping = useSelector(selectHomeAssetsTableGrouping);
    const areSmallBalancesShown = useSelector(selectAreHomeAssetSmallBalancesShown);
    const heldAssetKeys = useSelector(selectShownWalletAssetKeys);
    const displayedAssetKeys = useSelector(selectDisplayedWalletAssetKeys);

    const isCappable = displayedAssetKeys.length > HOME_ASSET_ROW_LIMIT;
    const isCapped = isCappable && !isExpanded;

    const assetKeys = useSelector(state => selectDisplayedWalletAssetKeys(state, isCapped));
    const networkSymbols = useSelector(state =>
        grouping === 'networks' ? selectShownNetworkSymbols(state, isCapped) : NO_NETWORKS,
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
            dispatch(showHomeAssetSmallBalances(areShown));
        },
        [dispatch],
    );

    if (heldAssetKeys.length === 0) {
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
                                onChange={changeGrouping}
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
                                  isCapped={isCapped}
                              />
                          ))
                        : assetKeys.map(assetKey => (
                              <HomeAssetRow key={assetKey} assetKey={assetKey} />
                          ))}
                    {isCappable && (
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
