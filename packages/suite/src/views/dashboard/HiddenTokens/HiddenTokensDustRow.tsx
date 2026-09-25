import { useState } from 'react';

import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Icon, Row, Table, Text } from '@trezor/components';
import { CaretDownIcon, CaretUpIcon } from '@trezor/icons';
import { BigNumber } from '@trezor/utils';

import { HiddenTokenRow } from './HiddenTokenRow';
import { type AssetRow, type AssetTotal } from '../AssetFirstTable/assetFirstTableSelectors';
import { ASSET_FIRST_CELL_PADDING } from '../AssetFirstTable/assetFirstTableUtils';

const ZERO = new BigNumber(0);

type HiddenTokensDustRowProps = {
    rows: readonly AssetRow[];
    onUnhide: (asset: AssetTotal) => void;
};

export const HiddenTokensDustRow = ({ rows, onUnhide }: HiddenTokensDustRowProps) => {
    const [areRowsShown, setAreRowsShown] = useState(false);
    const { BaseCurrencyAmountFormatter } = useFormatters();

    if (rows.length === 0) {
        return null;
    }

    const fiatValue = rows.reduce((total, row) => total.plus(row.fiatValue), ZERO);

    return (
        <>
            <Table.Row
                onClick={() => setAreRowsShown(shown => !shown)}
                data-testid="@hidden-tokens/dust"
            >
                <Table.Cell padding={ASSET_FIRST_CELL_PADDING.first}>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_ASSET_FIRST_DUST_BALANCE" />
                    </Text>
                </Table.Cell>
                <Table.Cell align="end" colSpan={2} padding={ASSET_FIRST_CELL_PADDING.last}>
                    <Row gap={4} justifyContent="flex-end">
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            {BaseCurrencyAmountFormatter.format(asBaseCurrencyAmount(fiatValue))}
                        </Text>
                        <Icon
                            as={areRowsShown ? CaretUpIcon : CaretDownIcon}
                            size={16}
                            intent="neutral"
                            priority="secondary"
                        />
                    </Row>
                </Table.Cell>
            </Table.Row>

            {rows.map(row => (
                <HiddenTokenRow
                    key={row.assetKey}
                    asset={row}
                    isCollapsed={!areRowsShown}
                    onClick={() => onUnhide(row)}
                />
            ))}
        </>
    );
};
