import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { localizePercentage } from '@suite-common/wallet-utils';
import { Card, Column, Row, Skeleton, Text } from '@trezor/components';
import { type BigNumber } from '@trezor/utils';

import { useDiscovery, useSelector } from 'src/hooks/suite';

import { AssetFirstBalanceGraph } from './AssetFirstBalanceGraph';
import { AssetFirstTotalBalance } from './AssetFirstTotalBalance';
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
        <Row gap={12} data-testid="@dashboard/asset-first/week-change">
            <Text typographyStyle="body-md" color="contentTertiary">
                <Translation id="TR_ASSET_FIRST_WEEK_PERIOD" />
            </Text>
            <Text typographyStyle="body-md" intent={intent}>
                {sign}
                {BaseCurrencyAmountFormatter.format(asBaseCurrencyAmount(weekChange.abs()))}
            </Text>
            {weekChangePercent !== undefined && (
                <Text typographyStyle="body-md" intent={intent}>
                    {sign}
                    {localizePercentage({
                        valueInFraction: weekChangePercent.abs().div(100).toNumber(),
                        locale,
                        numDecimals: 2,
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
    const { isDiscoveryRunning } = useDiscovery();

    const { fiatValue, weekChange, weekChangePercent } = useMemo(
        () => getAssetFirstTotals(rows),
        [rows],
    );

    return (
        <Card>
            <Row justifyContent="space-between" alignItems="center" gap={16}>
                <Column alignItems="flex-start" gap={8}>
                    <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                        <Translation id="TR_ASSET_FIRST_TOTAL_BALANCE" />
                    </Text>
                    {isDiscoveryRunning ? (
                        <Skeleton width={180} height={56} />
                    ) : (
                        <>
                            <AssetFirstTotalBalance fiatValue={fiatValue} />
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
