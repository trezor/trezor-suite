import { Translation } from '@suite/intl';
import { selectHomeAssetTotals } from '@suite-common/assets';
import { Card, Column, Skeleton, Text } from '@trezor/components';

import { useDiscovery, useSelector } from 'src/hooks/suite';

import { HomeBalanceChange } from './HomeBalanceChange';
import { HomeTotalBalance } from './HomeTotalBalance';

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
                            <HomeBalanceChange
                                period={<Translation id="TR_HOME_ASSET_WEEK_PERIOD" />}
                                change={weekChange}
                                changePercent={weekChangePercent}
                                data-testid="@dashboard/home-asset/week-change"
                            />
                        )}
                    </>
                )}
            </Column>
        </Card>
    );
};
