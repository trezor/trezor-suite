import { useMemo, useState } from 'react';

import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Icon, Row, Table, Text } from '@trezor/components';
import { type StaticSessionId } from '@trezor/device-utils';
import { CaretDownIcon, CaretUpIcon } from '@trezor/icons';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

import { HiddenTokenRow } from './HiddenTokenRow';
import {
    type AssetAccounts,
    selectAssetFiatValues,
} from '../HomeAssetTable/homeAssetTableSelectors';
import { HOME_ASSET_CELL_PADDING } from '../HomeAssetTable/homeAssetTableUtils';

const ZERO = new BigNumber(0);

type HiddenTokensDustRowProps = {
    rows: readonly AssetAccounts[];
    deviceState: StaticSessionId;
    onUnhide: (assetAccounts: AssetAccounts) => void;
};

export const HiddenTokensDustRow = ({ rows, deviceState, onUnhide }: HiddenTokensDustRowProps) => {
    const [areRowsShown, setAreRowsShown] = useState(false);
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const fiatValues = useSelector(state => selectAssetFiatValues(state, deviceState));

    const fiatValue = useMemo(
        () =>
            rows.reduce(
                (total, assetAccounts) => total.plus(fiatValues.get(assetAccounts) ?? ZERO),
                ZERO,
            ),
        [rows, fiatValues],
    );

    if (rows.length === 0) {
        return null;
    }

    return (
        <>
            <Table.Row
                onClick={() => setAreRowsShown(shown => !shown)}
                data-testid="@hidden-tokens/dust"
            >
                <Table.Cell padding={HOME_ASSET_CELL_PADDING.first}>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_HOME_ASSET_DUST_BALANCE" />
                    </Text>
                </Table.Cell>
                <Table.Cell align="end" colSpan={2} padding={HOME_ASSET_CELL_PADDING.last}>
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

            {rows.map(assetAccounts => (
                <HiddenTokenRow
                    key={assetAccounts[0].assetKey}
                    assetAccounts={assetAccounts}
                    isCollapsed={!areRowsShown}
                    onClick={() => onUnhide(assetAccounts)}
                />
            ))}
        </>
    );
};
