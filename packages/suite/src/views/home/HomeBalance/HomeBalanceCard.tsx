import { Translation } from '@suite/intl';
import { selectHomeAssetTotals } from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Card, Column, Row, Skeleton, Text } from '@trezor/components';
import { type BigNumber } from '@trezor/utils';

import { HiddenPlaceholder, Sign } from 'src/components/suite';
import { TrendBadge } from 'src/components/suite/Ticker/TrendBadge';
import { useDiscovery, useSelector } from 'src/hooks/suite';

import { HomeTotalBalance } from './HomeTotalBalance';

type WeekChangeProps = {
    weekChange: BigNumber;
    weekChangePercent: BigNumber | undefined;
};

const WeekChange = ({ weekChange, weekChangePercent }: WeekChangeProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const changed = BaseCurrencyAmountFormatter.format(asBaseCurrencyAmount(weekChange.abs()));

    return (
        <Row gap={12} data-testid="@dashboard/home-asset/week-change">
            <Text typographyStyle="body-md" color="contentTertiary">
                <Translation id="TR_HOME_ASSET_WEEK_PERIOD" />
            </Text>
            <HiddenPlaceholder>
                <Row gap={0} alignItems="center">
                    <Sign value={weekChange} />
                    <Text typographyStyle="body-md">{changed}</Text>
                </Row>
            </HiddenPlaceholder>
            {weekChangePercent !== undefined && (
                <TrendBadge valueInFraction={weekChangePercent.toNumber()} />
            )}
        </Row>
    );
};

export const HomeBalanceCard = () => {
    const { isDiscoveryRunning } = useDiscovery();
    const { fiatValue, weekChange, weekChangePercent } = useSelector(selectHomeAssetTotals);

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
                        <HomeTotalBalance fiatValue={fiatValue} />
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
