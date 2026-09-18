import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { isSignValuePositive, useFormatters } from '@suite-common/formatters';
import { type SignValue } from '@suite-common/suite-types';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { localizePercentage } from '@suite-common/wallet-utils';
import { Card, Column, Row, Skeleton, Text } from '@trezor/components';
import { type StaticSessionId } from '@trezor/device-utils';
import { type BigNumber } from '@trezor/utils';

import { useDiscovery, useSelector } from 'src/hooks/suite';

import { HomeAssetTotalBalance } from './HomeAssetTotalBalance';
import { selectHomeAssetTotals } from './homeAssetTableSelectors';

type WeekChangeProps = {
    weekChange: BigNumber;
    weekChangePercent: BigNumber | undefined;
};

const WeekChange = ({ weekChange, weekChangePercent }: WeekChangeProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const locale = useSelector(selectLanguage);
    const signValue: SignValue = weekChange.isNegative() ? 'negative' : 'positive';
    const isGain = isSignValuePositive(signValue);
    const intent = isGain ? 'brand' : 'critical';
    const sign = isGain ? '+' : '−';
    const changed = BaseCurrencyAmountFormatter.format(asBaseCurrencyAmount(weekChange.abs()));
    const changedPercent =
        weekChangePercent === undefined
            ? undefined
            : localizePercentage({
                  valueInFraction: weekChangePercent.abs().toNumber(),
                  locale,
                  numDecimals: 2,
              });

    return (
        <Row gap={12} data-testid="@dashboard/home-asset/week-change">
            <Text typographyStyle="body-md" color="contentTertiary">
                <Translation id="TR_HOME_ASSET_WEEK_PERIOD" />
            </Text>
            <Text typographyStyle="body-md" intent={intent}>
                {sign}
                {changed}
            </Text>
            {changedPercent !== undefined && (
                <Text typographyStyle="body-md" intent={intent}>
                    {sign}
                    {changedPercent}
                </Text>
            )}
        </Row>
    );
};

type HomeAssetBalanceCardProps = {
    deviceState: StaticSessionId;
};

export const HomeAssetBalanceCard = ({ deviceState }: HomeAssetBalanceCardProps) => {
    const { isDiscoveryRunning } = useDiscovery();
    const { fiatValue, weekChange, weekChangePercent } = useSelector(state =>
        selectHomeAssetTotals(state, deviceState),
    );

    return (
        <Card>
            <Column alignItems="flex-start" gap={8}>
                <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                    <Translation id="TR_HOME_ASSET_TOTAL_BALANCE" />
                </Text>
                {isDiscoveryRunning ? (
                    <Skeleton width={180} height={56} />
                ) : (
                    <>
                        <HomeAssetTotalBalance fiatValue={fiatValue} />
                        {weekChange !== undefined && (
                            <WeekChange
                                weekChange={weekChange}
                                weekChangePercent={weekChangePercent}
                            />
                        )}
                    </>
                )}
            </Column>
        </Card>
    );
};
