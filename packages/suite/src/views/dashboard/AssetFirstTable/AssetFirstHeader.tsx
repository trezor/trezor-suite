import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { useFormatters } from '@suite-common/formatters';
import { selectDispatch } from '@suite-common/redux-utils';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Button, Column, Row, Skeleton, Text } from '@trezor/components';
import { ArrowsLeftRightIcon } from '@trezor/icons';
import { type BigNumber } from '@trezor/utils';

import { GlobalSendReceive } from 'src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/GlobalSendReceive';
import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { useDiscovery, useSelector } from 'src/hooks/suite';

import { type AssetRow, getAssetFirstTotals } from './assetFirstTableSelectors';

type WeekChangeProps = {
    weekChange: BigNumber;
};

const WeekChange = ({ weekChange }: WeekChangeProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const isGain = weekChange.gte(0);

    return (
        <Text
            typographyStyle="body-sm"
            intent={isGain ? 'brand' : 'critical'}
            data-testid="@dashboard/asset-first/week-change"
        >
            <Translation
                id="TR_ASSET_FIRST_WEEK_CHANGE"
                values={{
                    value: `${isGain ? '+' : '−'}${BaseCurrencyAmountFormatter.format(
                        asBaseCurrencyAmount(weekChange.abs()),
                    )}`,
                }}
            />
        </Text>
    );
};

/**
 * Swap, receive and send for the wallet rather than for an account.
 *
 * Receive and send are the app's own — they open the account picker every other page opens, rather
 * than guessing which account was meant. Swap opens the exchange form, which picks its own.
 */
const AssetFirstActions = () => {
    const { dispatch } = useServices(selectDispatch);

    return (
        <Row gap={8}>
            <Button
                intent="brand"
                priority="primary"
                iconRight={ArrowsLeftRightIcon}
                onClick={() => dispatch(gotoThunk({ routeName: 'wallet-trading-exchange' }))}
                data-testid="@dashboard/asset-first/swap"
            >
                <Translation id="TR_TRADING_SWAP" />
            </Button>
            <GlobalSendReceive />
        </Row>
    );
};

type AssetFirstHeaderProps = {
    /** The rows the total is over — the same ones the table below is given. */
    rows: readonly AssetRow[];
};

export const AssetFirstHeader = ({ rows }: AssetFirstHeaderProps) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const { isDiscoveryRunning } = useDiscovery();

    const { fiatValue, weekChange } = useMemo(() => getAssetFirstTotals(rows), [rows]);

    return (
        <Row justifyContent="space-between" alignItems="center" gap={16}>
            <Column alignItems="flex-start" gap={4}>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_ASSET_FIRST_TOTAL_BALANCE" />
                </Text>
                {isDiscoveryRunning ? (
                    <Skeleton width={180} height={44} />
                ) : (
                    <Row alignItems="baseline" gap={12}>
                        <FiatHeader
                            data-testid="@dashboard/asset-first/fiat-amount"
                            size="large"
                            amount={fiatValue.toFixed()}
                            localCurrency={baseCurrencyCode}
                        />
                        {weekChange !== undefined && <WeekChange weekChange={weekChange} />}
                    </Row>
                )}
            </Column>
            <AssetFirstActions />
        </Row>
    );
};
