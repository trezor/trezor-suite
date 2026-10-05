import { useCallback } from 'react';

import { Translation } from '@suite/intl';
import { selectShownNetworkSymbols, selectShownWalletAssetKeys } from '@suite-common/assets';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectHomeAssetsTableGrouping,
    setHomeAssetsTableGrouping,
} from '@suite-common/wallet-core';
import { type HomeAssetsTableGrouping } from '@suite-common/wallet-types';
import { Card, Table } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { HomeAssetNetworkSection } from './HomeAssetNetworkSection';
import { HomeAssetNewBanner } from './HomeAssetNewBanner';
import { HomeAssetRow } from './HomeAssetRow';
import { HomeAssetTableFilterHeader } from './HomeAssetTableFilter';
import { HOME_ASSET_CELL_PADDING } from './homeAssetTableLayout';

const NO_NETWORKS: readonly NetworkSymbol[] = [];

export const HomeAssetTable = () => {
    const { dispatch } = useServices(injectDispatch);
    const grouping = useSelector(selectHomeAssetsTableGrouping);
    const assetKeys = useSelector(selectShownWalletAssetKeys);
    // Grouping by networks is work the default arrangement must not pay for.
    const networkSymbols = useSelector(state =>
        grouping === 'networks' ? selectShownNetworkSymbols(state) : NO_NETWORKS,
    );

    const changeGrouping = useCallback(
        (chosen: HomeAssetsTableGrouping) => {
            dispatch(setHomeAssetsTableGrouping(chosen));
        },
        [dispatch],
    );

    if (assetKeys.length === 0) {
        return null;
    }

    return (
        <Card paddingType="none" data-testid="@dashboard/home-asset-table">
            <HomeAssetNewBanner />
            <Table isRowHighlightedOnHover colWidths={[{ minWidth: '200px' }, {}, {}]}>
                <Table.Header>
                    <Table.Row>
                        <Table.Cell padding={HOME_ASSET_CELL_PADDING.first}>
                            <HomeAssetTableFilterHeader
                                grouping={grouping}
                                onChange={changeGrouping}
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
                              <HomeAssetNetworkSection key={symbol} symbol={symbol} />
                          ))
                        : assetKeys.map(assetKey => (
                              <HomeAssetRow key={assetKey} assetKey={assetKey} />
                          ))}
                </Table.Body>
            </Table>
        </Card>
    );
};
