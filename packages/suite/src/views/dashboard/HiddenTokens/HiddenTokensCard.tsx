import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Card, Column, Table, Text } from '@trezor/components';

import { AssetFirstRow } from '../AssetFirstTable/AssetFirstRow';
import { type AssetRow } from '../AssetFirstTable/assetFirstTableSelectors';
import { ASSET_FIRST_CELL_PADDING } from '../AssetFirstTable/assetFirstTableUtils';

type HiddenTokensCardProps = {
    heading: ReactNode;
    rows: readonly AssetRow[];
    onUnhide: (row: AssetRow) => void;
    'data-testid': string;
};

export const HiddenTokensCard = ({
    heading,
    rows,
    onUnhide,
    'data-testid': dataTestId,
}: HiddenTokensCardProps) => {
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
                                onClick={() => onUnhide(row)}
                            />
                        ))}
                    </Table.Body>
                </Table>
            </Column>
        </Card>
    );
};
