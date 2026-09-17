import { Translation } from '@suite/intl';
import { Card, Table } from '@trezor/components';

import { AssetFirstRow } from './AssetFirstRow';
import { type AssetRow } from './assetFirstTableSelectors';
import { ASSET_FIRST_CELL_PADDING } from './assetFirstTableUtils';

/**
 * The dashboard's assets, one row per asset and network.
 *
 * Where `AssetsView` shows a network and folds what it holds into it, this shows what the wallet
 * holds and says which network each holding is on — so Ether on Ethereum and Ether on Arbitrum are
 * two lines, and a stablecoin held on three networks is three.
 *
 * Behind the asset-first home table experiment.
 */
type AssetFirstTableProps = {
    rows: readonly AssetRow[];
};

export const AssetFirstTable = ({ rows }: AssetFirstTableProps) => {
    if (rows.length === 0) {
        return null;
    }

    return (
        <Card paddingType="none" data-testid="@dashboard/asset-first-table">
            <Table isRowHighlightedOnHover colWidths={[{ minWidth: '200px' }, {}, {}]}>
                <Table.Header>
                    <Table.Row>
                        <Table.Cell padding={ASSET_FIRST_CELL_PADDING.first}>
                            <Translation id="TR_ASSET" />
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
                    {rows.map(row => (
                        <AssetFirstRow key={row.assetKey} row={row} />
                    ))}
                </Table.Body>
            </Table>
        </Card>
    );
};
