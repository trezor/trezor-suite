import { useState } from 'react';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import {
    HOME_ASSET_ROW_LIMIT,
    getAccountAssetTableSelectors,
    getHomeAssetRowLimit,
    selectAreHomeAssetSmallBalancesDisplayed,
} from '@suite-common/assets';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { setAreHomeAssetSmallBalancesShown } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Card, Table } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from '#src/hooks/suite';
import { AssetTableRow } from '#src/views/home/HomeAssetsTable/AssetTableRow';
import { HomeAssetExpandRow } from '#src/views/home/HomeAssetsTable/HomeAssetExpandRow';
import { HomeAssetTableFilterHeader } from '#src/views/home/HomeAssetsTable/HomeAssetTableFilter';
import {
    HOME_ASSET_CELL_PADDING,
    HOME_ASSET_COL_WIDTHS,
} from '#src/views/home/HomeAssetsTable/homeAssetTableLayout';

const getRowTestId = (networkSymbol: NetworkSymbol, contractAddress: TokenAddress | undefined) =>
    contractAddress === undefined
        ? `@wallet/account-asset/coin/${networkSymbol}`
        : `@wallet/account-asset/token/${contractAddress}`;

type AccountAssetTableProps = {
    accountKey: AccountKey;
};

/**
 * The Home asset table for one account: its coin, its stake counted in, and its tokens. The
 * small-balance switch is the one Home keeps, though it never hides the coin, so the table is never
 * left empty; there is no grouping, as every row is the account's network.
 */
export const AccountAssetTable = ({ accountKey }: AccountAssetTableProps) => {
    const { dispatch } = useServices(injectDispatch);
    const [isExpanded, setIsExpanded] = useState(false);
    const selectors = getAccountAssetTableSelectors(accountKey);
    const {
        selectDisplayedWalletAssetKeys,
        selectIsHomeAssetTableFoldable,
        selectSmallBalanceSummary,
    } = selectors;
    const smallBalances = useSelector(selectSmallBalanceSummary);
    const areSmallBalancesShown = useSelector(selectAreHomeAssetSmallBalancesDisplayed);
    const isFoldable = useSelector(state =>
        selectIsHomeAssetTableFoldable(state, HOME_ASSET_ROW_LIMIT),
    );
    const rowLimit = getHomeAssetRowLimit({ isFoldable, isExpanded });
    const assetKeys = useSelector(state => selectDisplayedWalletAssetKeys(state, rowLimit));

    const changeSmallBalances = (areShown: boolean) => {
        // Turning them on while the table is folded would otherwise change nothing on screen.
        if (areShown) {
            setIsExpanded(true);
        }
        dispatch(setAreHomeAssetSmallBalancesShown(areShown));
    };

    return (
        <Card paddingType="none" data-testid="@wallet/account-assets/table">
            <Table isRowHighlightedOnHover colWidths={HOME_ASSET_COL_WIDTHS}>
                <Table.Header>
                    <Table.Row>
                        <Table.Cell padding={HOME_ASSET_CELL_PADDING.first}>
                            <HomeAssetTableFilterHeader
                                areSmallBalancesShown={areSmallBalancesShown}
                                smallBalances={smallBalances}
                                onSmallBalancesChange={changeSmallBalances}
                                onOpenHiddenTokens={() =>
                                    dispatch(gotoThunk({ routeName: 'suite-hidden-tokens' }))
                                }
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
                    {assetKeys.map(assetKey => (
                        <AssetTableRow
                            key={assetKey}
                            assetKey={assetKey}
                            selectors={selectors}
                            getTestId={getRowTestId}
                        />
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
