import { useState } from 'react';

import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Card, Table, Text } from '@trezor/components';
import { type StaticSessionId } from '@trezor/device-utils';

import { useSelector } from 'src/hooks/suite';

import { HomeAssetRow } from './HomeAssetRow';
import { HomeAssetTableFilterHeader } from './HomeAssetTableFilter';
import {
    type AssetAccounts,
    type HomeAssetSection,
    selectHomeAssetSections,
} from './homeAssetTableSelectors';
import { HOME_ASSET_CELL_PADDING, type HomeAssetGrouping } from './homeAssetTableUtils';

type SectionHeadingProps = {
    sectionKey: string;
    heading: NonNullable<HomeAssetSection['heading']>;
};

const SectionHeading = ({ sectionKey, heading }: SectionHeadingProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    return (
        <Table.Row
            isHighlightedOnHover={false}
            data-testid={`@dashboard/home-asset-group/${sectionKey}`}
        >
            <Table.Cell colSpan={2} padding={HOME_ASSET_CELL_PADDING.first}>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {heading.name}
                </Text>
            </Table.Cell>
            <Table.Cell align="end" padding={HOME_ASSET_CELL_PADDING.last}>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {BaseCurrencyAmountFormatter.format(asBaseCurrencyAmount(heading.fiatValue))}
                </Text>
            </Table.Cell>
        </Table.Row>
    );
};

const renderRows = (
    rows: readonly AssetAccounts[],
    deviceState: StaticSessionId,
    hasBorderTop?: boolean,
) =>
    rows.map(assetAccounts => (
        <HomeAssetRow
            key={assetAccounts[0].assetKey}
            assetAccounts={assetAccounts}
            deviceState={deviceState}
            hasBorderTop={hasBorderTop}
        />
    ));

type HomeAssetTableProps = {
    deviceState: StaticSessionId;
};

export const HomeAssetTable = ({ deviceState }: HomeAssetTableProps) => {
    const [grouping, setGrouping] = useState<HomeAssetGrouping>('default');
    const sections = useSelector(state => selectHomeAssetSections(grouping)(state, deviceState));

    if (sections.every(section => section.rows.length === 0)) {
        return null;
    }

    return (
        <Card paddingType="none" data-testid="@dashboard/home-asset-table">
            <Table isRowHighlightedOnHover colWidths={[{ minWidth: '200px' }, {}, {}]}>
                <Table.Header>
                    <Table.Row>
                        <Table.Cell padding={HOME_ASSET_CELL_PADDING.first}>
                            <HomeAssetTableFilterHeader
                                grouping={grouping}
                                onChange={setGrouping}
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
                    {sections.flatMap(section =>
                        section.heading === undefined
                            ? renderRows(section.rows, deviceState)
                            : [
                                  <SectionHeading
                                      key={section.key}
                                      sectionKey={section.key}
                                      heading={section.heading}
                                  />,
                                  ...renderRows(section.rows, deviceState, false),
                              ],
                    )}
                </Table.Body>
            </Table>
        </Card>
    );
};
