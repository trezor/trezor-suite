import { type ReactNode, useState } from 'react';

import { Translation } from '@suite/intl';
import { Card, Column, Table, Text } from '@trezor/components';

import { UnhideAssetModal } from './UnhideAssetModal';
import { AssetFirstRow } from '../AssetFirstTable/AssetFirstRow';
import { type AssetRow } from '../AssetFirstTable/assetFirstTableSelectors';
import { ASSET_FIRST_CELL_PADDING } from '../AssetFirstTable/assetFirstTableUtils';

type HiddenTokensCardProps = {
    heading: ReactNode;
    rows: readonly AssetRow[];
    'data-testid': string;
};

export const HiddenTokensCard = ({
    heading,
    rows,
    'data-testid': dataTestId,
}: HiddenTokensCardProps) => {
    const [rowToUnhide, setRowToUnhide] = useState<AssetRow>();

    if (rows.length === 0) {
        return null;
    }

    return (
        <Card paddingType="none" data-testid={dataTestId}>
            <Column alignItems="stretch">
                <Text
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    margin={{ top: 16, left: 20 }}
                >
                    {heading}
                </Text>
                <Table isRowHighlightedOnHover colWidths={[{ minWidth: '200px' }, {}, {}, {}]}>
                    <Table.Header>
                        <Table.Row>
                            <Table.Cell padding={ASSET_FIRST_CELL_PADDING.first}>
                                <Translation id="TR_ASSET" />
                            </Table.Cell>
                            <Table.Cell align="end">
                                <Translation id="TR_EXCHANGE_RATE" />
                            </Table.Cell>
                            <Table.Cell align="end">
                                <Translation id="TR_BALANCE" />
                            </Table.Cell>
                            <Table.Cell padding={ASSET_FIRST_CELL_PADDING.last} />
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {rows.map(row => (
                            <AssetFirstRow
                                key={row.assetKey}
                                row={row}
                                onClick={() => setRowToUnhide(row)}
                            />
                        ))}
                    </Table.Body>
                </Table>
            </Column>

            {rowToUnhide !== undefined && (
                <UnhideAssetModal row={rowToUnhide} onCancel={() => setRowToUnhide(undefined)} />
            )}
        </Card>
    );
};
