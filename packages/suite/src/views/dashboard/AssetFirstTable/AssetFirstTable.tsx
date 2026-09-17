import { useMemo, useState } from 'react';

import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Card, Table, Text } from '@trezor/components';

import { AssetFirstRow } from './AssetFirstRow';
import { AssetFirstTableFilterHeader } from './AssetFirstTableFilter';
import {
    type AssetFirstGrouping,
    type AssetFirstNetworkGroup,
    groupAssetRowsByNetwork,
} from './assetFirstTableGrouping';
import { type AssetRow } from './assetFirstTableSelectors';
import { ASSET_FIRST_CELL_PADDING } from './assetFirstTableUtils';

type NetworkGroupHeaderProps = {
    group: AssetFirstNetworkGroup;
};

/** Which network the rows under it are held on, and what is held there. */
const NetworkGroupHeader = ({ group }: NetworkGroupHeaderProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    return (
        <Table.Row data-testid={`@dashboard/asset-first-group/${group.symbol}`}>
            <Table.Cell colSpan={2} padding={ASSET_FIRST_CELL_PADDING.first}>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {group.name}
                </Text>
            </Table.Cell>
            <Table.Cell align="end" padding={ASSET_FIRST_CELL_PADDING.last}>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {BaseCurrencyAmountFormatter.format(asBaseCurrencyAmount(group.fiatValue))}
                </Text>
            </Table.Cell>
        </Table.Row>
    );
};

/**
 * The dashboard's assets, one row per asset and network.
 *
 * Where `AssetsView` shows a network and folds what it holds into it, this shows what the wallet
 * holds and says which network each holding is on — so Ether on Ethereum and Ether on Arbitrum are
 * two lines, and a stablecoin held on three networks is three. Grouping by network gathers those
 * same lines under a heading again, without changing which lines there are.
 *
 * Behind the asset-first home table experiment.
 */
type AssetFirstTableProps = {
    rows: readonly AssetRow[];
};

export const AssetFirstTable = ({ rows }: AssetFirstTableProps) => {
    const [grouping, setGrouping] = useState<AssetFirstGrouping>('default');

    const groups = useMemo(
        () => (grouping === 'networks' ? groupAssetRowsByNetwork(rows) : undefined),
        [grouping, rows],
    );

    if (rows.length === 0) {
        return null;
    }

    return (
        <Card paddingType="none" data-testid="@dashboard/asset-first-table">
            <Table isRowHighlightedOnHover colWidths={[{ minWidth: '200px' }, {}, {}]}>
                <Table.Header>
                    <Table.Row>
                        <Table.Cell padding={ASSET_FIRST_CELL_PADDING.first}>
                            <AssetFirstTableFilterHeader
                                grouping={grouping}
                                onChange={setGrouping}
                            />
                        </Table.Cell>
                        <Table.Cell align="end">
                            <Translation id="TR_EXCHANGE_RATE" />
                        </Table.Cell>
                        <Table.Cell align="end" padding={ASSET_FIRST_CELL_PADDING.last}>
                            <Translation id="TR_BALANCE" />
                        </Table.Cell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {groups === undefined
                        ? rows.map(row => <AssetFirstRow key={row.assetKey} row={row} />)
                        : groups.flatMap(group => [
                              <NetworkGroupHeader key={group.symbol} group={group} />,
                              ...group.rows.map(row => (
                                  <AssetFirstRow key={row.assetKey} row={row} />
                              )),
                          ])}
                </Table.Body>
            </Table>
        </Card>
    );
};
