import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { useFormatters } from '@suite-common/formatters';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { localizePercentage } from '@suite-common/wallet-utils';
import { Card, Column, Row, Skeleton, Text } from '@trezor/components';
import { type BigNumber } from '@trezor/utils';

import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { useDiscovery, useSelector } from 'src/hooks/suite';

import { AssetFirstBalanceGraph } from './AssetFirstBalanceGraph';
import { type AssetRow, getAssetFirstTotals } from './assetFirstTableSelectors';

type WeekChangeProps = {
    weekChange: BigNumber;
    weekChangePercent: BigNumber | undefined;
};

const WeekChange = ({ weekChange, weekChangePercent }: WeekChangeProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const locale = useSelector(selectLanguage);
    const isGain = weekChange.gte(0);
    const intent = isGain ? 'brand' : 'critical';
    const sign = isGain ? '+' : '−';

    return (
        <Row gap={8} data-testid="@dashboard/asset-first/week-change">
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id="TR_ASSET_FIRST_WEEK_PERIOD" />
            </Text>
            <Text typographyStyle="body-sm" intent={intent}>
                {sign}
                {BaseCurrencyAmountFormatter.format(asBaseCurrencyAmount(weekChange.abs()))}
            </Text>
            {weekChangePercent !== undefined && (
                <Text typographyStyle="body-sm" intent={intent}>
                    {localizePercentage({
                        valueInFraction: weekChangePercent.div(100).toNumber(),
                        locale,
                    })}
                </Text>
            )}
        </Row>
    );
};

type AssetFirstBalanceCardProps = {
    rows: readonly AssetRow[];
};

export const AssetFirstBalanceCard = ({ rows }: AssetFirstBalanceCardProps) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const { isDiscoveryRunning } = useDiscovery();

    const { fiatValue, weekChange, weekChangePercent } = useMemo(
        () => getAssetFirstTotals(rows),
        [rows],
    );

    return (
        <Card>
            <Row justifyContent="space-between" alignItems="center" gap={16}>
                <Column alignItems="flex-start" gap={4}>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_ASSET_FIRST_TOTAL_BALANCE" />
                    </Text>
                    {isDiscoveryRunning ? (
                        <Skeleton width={180} height={44} />
                    ) : (
                        <>
                            <FiatHeader
                                data-testid="@dashboard/asset-first/fiat-amount"
                                size="large"
                                amount={fiatValue.toFixed()}
                                localCurrency={baseCurrencyCode}
                            />
                            {weekChange !== undefined && (
                                <WeekChange
                                    weekChange={weekChange}
                                    weekChangePercent={weekChangePercent}
                                />
                            )}
                        </>
                    )}
                </Column>
                <AssetFirstBalanceGraph />
            </Row>
        </Card>
    );
};
