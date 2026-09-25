import { useState } from 'react';

import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { useFormatters } from '@suite-common/formatters';
import { injectDispatch } from '@suite-common/redux-utils';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Card, Table, Text } from '@trezor/components';
import { type StaticSessionId } from '@trezor/device-utils';

import { showSmallBalancesThunk } from 'src/actions/suite/assetTableThunks';
import { useSelector } from 'src/hooks/suite';
import { selectAreSmallBalancesShown } from 'src/reducers/suite/assetTableReducer';

import { AssetFirstExpandRow } from './AssetFirstExpandRow';
import { AssetFirstNewBanner } from './AssetFirstNewBanner';
import { AssetFirstRow } from './AssetFirstRow';
import { AssetFirstTableFilterHeader } from './AssetFirstTableFilter';
import {
    type AssetFirstSection,
    type AssetRow,
    selectAssetFirstSections,
} from './assetFirstTableSelectors';
import {
    ASSET_FIRST_CELL_PADDING,
    ASSET_FIRST_COLLAPSED_ROW_COUNT,
    type AssetFirstArrangement,
    type AssetFirstGrouping,
    DEFAULT_ASSET_FIRST_ARRANGEMENT,
} from './assetFirstTableUtils';

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

const countRows = (sections: readonly AssetFirstSection[]) =>
    sections.reduce((count, section) => count + section.rows.length, 0);

/** The first `limit` assets, and the sections they fall in — a section left with none is dropped. */
const takeRows = (sections: readonly AssetFirstSection[], limit: number) => {
    let left = limit;

    return sections.flatMap(section => {
        const rows = section.rows.slice(0, left);
        left -= rows.length;

        return rows.length === 0 ? [] : [{ ...section, rows }];
    });
};

type AssetFirstTableProps = {
    /** Whose assets: the page knows, so the table does not go looking. */
    deviceState: StaticSessionId;
};

export const AssetFirstTable = ({ deviceState }: AssetFirstTableProps) => {
    const { dispatch } = useServices(injectDispatch);
    // The grouping is how the user is looking at the table now; whether small balances belong in
    // it is a setting, and outlives the visit.
    const [grouping, setGrouping] = useState<AssetFirstGrouping>(
        DEFAULT_ASSET_FIRST_ARRANGEMENT.grouping,
    );
    const areSmallBalancesShown = useSelector(selectAreSmallBalancesShown);
    const arrangement: AssetFirstArrangement = { grouping, areSmallBalancesShown };

    const [isExpanded, setIsExpanded] = useState(false);

    const sections = useSelector(state =>
        selectAssetFirstSections(arrangement)(state, deviceState),
    );

    const changeArrangement = (chosen: AssetFirstArrangement) => {
        setGrouping(chosen.grouping);

        if (chosen.areSmallBalancesShown !== areSmallBalancesShown) {
            dispatch(showSmallBalancesThunk({ areShown: chosen.areSmallBalancesShown }));
        }
    };

    const rowCount = countRows(sections);

    if (rowCount === 0) {
        return null;
    }

    const isCollapsible = rowCount > ASSET_FIRST_COLLAPSED_ROW_COUNT;
    const shownSections =
        isCollapsible && !isExpanded
            ? takeRows(sections, ASSET_FIRST_COLLAPSED_ROW_COUNT)
            : sections;

    return (
        <Card paddingType="none" data-testid="@dashboard/asset-first-table">
            <AssetFirstNewBanner />
            <Table isRowHighlightedOnHover colWidths={[{ minWidth: '200px' }, {}, {}]}>
                <Table.Header>
                    <Table.Row>
                        <Table.Cell padding={ASSET_FIRST_CELL_PADDING.first}>
                            <AssetFirstTableFilterHeader
                                arrangement={arrangement}
                                onChange={changeArrangement}
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
                    {shownSections.flatMap(section =>
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
                    {isCollapsible && (
                        <AssetFirstExpandRow
                            isExpanded={isExpanded}
                            onToggle={() => setIsExpanded(expanded => !expanded)}
                        />
                    )}
                </Table.Body>
            </Table>
        </Card>
    );
};
