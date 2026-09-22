import { useState } from 'react';

import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Icon, Row, Table, Text } from '@trezor/components';
import { CaretDownIcon, CaretUpIcon } from '@trezor/icons';
import { BigNumber } from '@trezor/utils';

import { AssetFirstRow } from './AssetFirstRow';
import { type AssetRow } from './assetFirstTableSelectors';
import { ASSET_FIRST_CELL_PADDING } from './assetFirstTableUtils';

const ZERO = new BigNumber(0);

type AssetFirstDustRowProps = {
    rows: readonly AssetRow[];
};

export const AssetFirstDustRow = ({ rows }: AssetFirstDustRowProps) => {
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
                data-testid="@dashboard/asset-first/dust"
            >
                <Table.Cell colSpan={2} padding={ASSET_FIRST_CELL_PADDING.first}>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_ASSET_FIRST_DUST_BALANCE" />
                    </Text>
                </Table.Cell>
                <Table.Cell align="end" padding={ASSET_FIRST_CELL_PADDING.last}>
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

            {areRowsShown &&
                rows.map(row => (
                    <AssetFirstRow key={row.assetKey} row={row} hasBorderTop={false} />
                ))}
        </>
    );
};
