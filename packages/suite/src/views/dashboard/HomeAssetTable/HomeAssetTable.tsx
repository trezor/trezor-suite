import { Translation } from '@suite/intl';
import { Card, Table } from '@trezor/components';
import { type StaticSessionId } from '@trezor/device-utils';

import { useSelector } from 'src/hooks/suite';

import { HomeAssetRow } from './HomeAssetRow';
import { selectHomeAssetRows } from './homeAssetTableSelectors';
import { HOME_ASSET_CELL_PADDING } from './homeAssetTableUtils';

type HomeAssetTableProps = {
    deviceState: StaticSessionId;
};

export const HomeAssetTable = ({ deviceState }: HomeAssetTableProps) => {
    const rows = useSelector(state => selectHomeAssetRows(state, deviceState));

    if (rows.length === 0) {
        return null;
    }

    return (
        <Card paddingType="none" data-testid="@dashboard/home-asset-table">
            <Table isRowHighlightedOnHover colWidths={[{ minWidth: '200px' }, {}, {}]}>
                <Table.Header>
                    <Table.Row>
                        <Table.Cell padding={HOME_ASSET_CELL_PADDING.first}>
                            <Translation id="TR_ASSET" />
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
                    {rows.map(assetAccounts => (
                        <HomeAssetRow
                            key={assetAccounts[0].assetKey}
                            assetAccounts={assetAccounts}
                            deviceState={deviceState}
                        />
                    ))}
                </Table.Body>
            </Table>
        </Card>
    );
};
