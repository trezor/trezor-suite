import { useMemo, useState } from 'react';

import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Icon, Row, Table, Text } from '@trezor/components';
import { type StaticSessionId } from '@trezor/device-utils';
import { CaretDownIcon, CaretUpIcon } from '@trezor/icons';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

import { HomeAssetRow } from './HomeAssetRow';
import { type AssetAccounts, selectAssetFiatValues } from './homeAssetTableSelectors';
import { HOME_ASSET_CELL_PADDING } from './homeAssetTableUtils';

const ZERO = new BigNumber(0);

type HomeAssetDustRowProps = {
    rows: readonly AssetAccounts[];
    deviceState: StaticSessionId;
};

export const HomeAssetDustRow = ({ rows, deviceState }: HomeAssetDustRowProps) => {
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
                data-testid="@dashboard/home-asset/dust"
            >
                <Table.Cell colSpan={2} padding={HOME_ASSET_CELL_PADDING.first}>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_HOME_ASSET_DUST_BALANCE" />
                    </Text>
                </Table.Cell>
                <Table.Cell align="end" padding={HOME_ASSET_CELL_PADDING.last}>
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
                rows.map(assetAccounts => (
                    <HomeAssetRow
                        key={assetAccounts[0].assetKey}
                        assetAccounts={assetAccounts}
                        deviceState={deviceState}
                        hasBorderTop={false}
                    />
                ))}
        </>
    );
};
