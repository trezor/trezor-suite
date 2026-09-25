import { useState } from 'react';

import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Card, Table, Text } from '@trezor/components';
import { type StaticSessionId } from '@trezor/device-utils';

import { useSelector } from 'src/hooks/suite';

import { AssetFirstRow } from './AssetFirstRow';
import { AssetFirstTableFilterHeader } from './AssetFirstTableFilter';
import {
    type AssetFirstSection,
    type AssetRow,
    selectAssetFirstSections,
} from './assetFirstTableSelectors';
import { ASSET_FIRST_CELL_PADDING, type AssetFirstGrouping } from './assetFirstTableUtils';

type SectionHeadingProps = {
    sectionKey: string;
    heading: NonNullable<AssetFirstSection['heading']>;
};

const SectionHeading = ({ sectionKey, heading }: SectionHeadingProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    return (
        <Table.Row
            isHighlightedOnHover={false}
            data-testid={`@dashboard/asset-first-group/${sectionKey}`}
        >
            <Table.Cell colSpan={2} padding={ASSET_FIRST_CELL_PADDING.first}>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {heading.name}
                </Text>
            </Table.Cell>
            <Table.Cell align="end" padding={ASSET_FIRST_CELL_PADDING.last}>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {BaseCurrencyAmountFormatter.format(asBaseCurrencyAmount(heading.fiatValue))}
                </Text>
            </Table.Cell>
        </Table.Row>
    );
};

const renderRows = (rows: readonly AssetRow[], hasBorderTop?: boolean) =>
    rows.map(row => <AssetFirstRow key={row.assetKey} row={row} hasBorderTop={hasBorderTop} />);

type AssetFirstTableProps = {
    /** Whose assets: the page knows, so the table does not go looking. */
    deviceState: StaticSessionId;
};

export const AssetFirstTable = ({ deviceState }: AssetFirstTableProps) => {
    const [grouping, setGrouping] = useState<AssetFirstGrouping>('default');
    const sections = useSelector(state => selectAssetFirstSections(grouping)(state, deviceState));

    if (sections.every(section => section.rows.length === 0)) {
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
                    {sections.flatMap(section =>
                        section.heading === undefined
                            ? renderRows(section.rows)
                            : [
                                  <SectionHeading
                                      key={section.key}
                                      sectionKey={section.key}
                                      heading={section.heading}
                                  />,
                                  // The line belongs between sections, not inside one.
                                  ...renderRows(section.rows, false),
                              ],
                    )}
                </Table.Body>
            </Table>
        </Card>
    );
};
