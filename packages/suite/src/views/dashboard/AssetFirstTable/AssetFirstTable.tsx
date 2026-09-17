import { useState } from 'react';

import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Card, Table, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { AssetFirstRow } from './AssetFirstRow';
import { AssetFirstTableFilterHeader } from './AssetFirstTableFilter';
import { type AssetFirstGrouping, type AssetFirstNetworkGroup } from './assetFirstTableGrouping';
import { type AssetRow, selectAssetFirstTableView } from './assetFirstTableSelectors';
import { ASSET_FIRST_CELL_PADDING } from './assetFirstTableUtils';

type NetworkGroupHeaderProps = {
    group: AssetFirstNetworkGroup;
};

const NetworkGroupHeader = ({ group }: NetworkGroupHeaderProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    return (
        <Table.Row
            isHighlightedOnHover={false}
            data-testid={`@dashboard/asset-first-group/${group.symbol}`}
        >
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

const renderRows = (rows: readonly AssetRow[], hasBorderTop?: boolean) =>
    rows.map(row => <AssetFirstRow key={row.assetKey} row={row} hasBorderTop={hasBorderTop} />);

export const AssetFirstTable = () => {
    const [grouping, setGrouping] = useState<AssetFirstGrouping>('default');
    const view = useSelector(selectAssetFirstTableView(grouping));

    const isEmpty =
        view.grouping === 'networks' ? view.groups.length === 0 : view.rows.length === 0;

    if (isEmpty) {
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
                    {view.grouping === 'networks'
                        ? view.groups.flatMap(group => [
                              <NetworkGroupHeader key={group.symbol} group={group} />,
                              ...renderRows(group.rows, false),
                          ])
                        : renderRows(view.rows)}
                </Table.Body>
            </Table>
        </Card>
    );
};
