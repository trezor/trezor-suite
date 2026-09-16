import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Column, Row, Skeleton, Text } from '@trezor/components';
import { type BigNumber } from '@trezor/utils';

import { GlobalSendReceive } from 'src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/GlobalSendReceive';
import { TradeActions } from 'src/components/suite/layouts/SuiteLayout/PageHeader/TradeActions';
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
 * The app's own global actions, the ones the page header carries everywhere else — buying,
 * selling, receiving and sending for the wallet, each with the account picker behind it. The page
 * suppresses that header, so it brings them here rather than inventing its own.
 */
const AssetFirstActions = () => (
    <Row gap={8}>
        <TradeActions />
        <GlobalSendReceive />
    </Row>
);

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
