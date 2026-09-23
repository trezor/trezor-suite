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

import { HomeAssetExpandRow } from './HomeAssetExpandRow';
import { HomeAssetNewBanner } from './HomeAssetNewBanner';
import { HomeAssetRow } from './HomeAssetRow';
import { HomeAssetTableFilterHeader } from './HomeAssetTableFilter';
import {
    type AssetAccounts,
    type HomeAssetSection,
    selectHomeAssetSections,
} from './homeAssetTableSelectors';
import {
    DEFAULT_HOME_ASSET_ARRANGEMENT,
    HOME_ASSET_CELL_PADDING,
    HOME_ASSET_COLLAPSED_ROW_COUNT,
    type HomeAssetArrangement,
    type HomeAssetGrouping,
} from './homeAssetTableUtils';

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

const countRows = (sections: readonly HomeAssetSection[]) =>
    sections.reduce((count, section) => count + section.rows.length, 0);

const takeRows = (sections: readonly HomeAssetSection[], limit: number) => {
    let left = limit;

    return sections.flatMap(section => {
        const rows = section.rows.slice(0, left);
        left -= rows.length;

        return rows.length === 0 ? [] : [{ ...section, rows }];
    });
};

type HomeAssetTableProps = {
    deviceState: StaticSessionId;
};

export const HomeAssetTable = ({ deviceState }: HomeAssetTableProps) => {
    const { dispatch } = useServices(injectDispatch);
    const [grouping, setGrouping] = useState<HomeAssetGrouping>(
        DEFAULT_HOME_ASSET_ARRANGEMENT.grouping,
    );
    const areSmallBalancesShown = useSelector(selectAreSmallBalancesShown);
    const arrangement: HomeAssetArrangement = { grouping, areSmallBalancesShown };

    const [isExpanded, setIsExpanded] = useState(false);

    const sections = useSelector(state => selectHomeAssetSections(arrangement)(state, deviceState));

    const changeArrangement = (chosen: HomeAssetArrangement) => {
        setGrouping(chosen.grouping);

        if (chosen.areSmallBalancesShown !== areSmallBalancesShown) {
            dispatch(showSmallBalancesThunk({ areShown: chosen.areSmallBalancesShown }));
        }
    };

    const rowCount = countRows(sections);

    if (rowCount === 0) {
        return null;
    }

    const isCollapsible = rowCount > HOME_ASSET_COLLAPSED_ROW_COUNT;
    const shownSections =
        isCollapsible && !isExpanded
            ? takeRows(sections, HOME_ASSET_COLLAPSED_ROW_COUNT)
            : sections;

    return (
        <Card paddingType="none" data-testid="@dashboard/home-asset-table">
            <HomeAssetNewBanner />
            <Table isRowHighlightedOnHover colWidths={[{ minWidth: '200px' }, {}, {}]}>
                <Table.Header>
                    <Table.Row>
                        <Table.Cell padding={HOME_ASSET_CELL_PADDING.first}>
                            <HomeAssetTableFilterHeader
                                arrangement={arrangement}
                                onChange={changeArrangement}
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
                    {shownSections.flatMap(section =>
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
                    {isCollapsible && (
                        <HomeAssetExpandRow
                            isExpanded={isExpanded}
                            onToggle={() => setIsExpanded(expanded => !expanded)}
                        />
                    )}
                </Table.Body>
            </Table>
        </Card>
    );
};
