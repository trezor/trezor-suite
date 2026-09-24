import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BannerInline, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

import { EarnBalanceBreakdown } from './EarnBalanceBreakdown';
import { useEarnBalance } from '../../hooks/earn/useEarnBalance';
import { type StakingListItem, type YieldListItem } from '../../types';

type EarnBalanceCardProps = {
    stakingPositions: StakingListItem[];
    yieldPositions: YieldListItem[];
};

export const EarnBalanceCard = ({ stakingPositions, yieldPositions }: EarnBalanceCardProps) => {
    const earnBalance = useEarnBalance({
        stakingPositions,
        yieldPositions,
    });

    const {
        totalStakingFiatAmount,
        totalYieldFiatAmount,
        totalEarnFiatAmount,
        isFiatRatesLoading,
        isFiatTotalIncomplete,
        isFiatTotalUnavailable,
        retryMissingFiatRates,
    } = earnBalance;

    const isBreakdownDisplayed =
        stakingPositions.length > 0 &&
        yieldPositions.length > 0 &&
        !isFiatRatesLoading &&
        !isFiatTotalIncomplete &&
        !isFiatTotalUnavailable;

    return (
        <Card borderColor="borderNeutral" testID="@earn/balance-card">
            <VStack spacing="sp24">
                <VStack spacing="sp2">
                    <Text variant="body-md" color="contentSecondary">
                        <Translation id="earn.earnScreen.depositsCard.title" />
                    </Text>

                    {isFiatTotalUnavailable ? (
                        <Text variant="headline-md">
                            <Translation id="earn.notAvailableShort" />
                        </Text>
                    ) : (
                        <HStack spacing="sp4" alignItems="center">
                            {isFiatTotalIncomplete && <Text variant="headline-md">~</Text>}
                            <BaseCurrencyAmountFormatter
                                value={asBaseCurrencyAmount(new BigNumber(totalEarnFiatAmount))}
                                variant="headline-md"
                                isDiscreetText={false}
                                isLoading={isFiatRatesLoading}
                            />
                        </HStack>
                    )}
                </VStack>

                {isBreakdownDisplayed && (
                    <EarnBalanceBreakdown
                        totalStakingFiatAmount={totalStakingFiatAmount}
                        totalYieldFiatAmount={totalYieldFiatAmount}
                        totalEarnFiatAmount={totalEarnFiatAmount}
                    />
                )}

                {isFiatTotalIncomplete && (
                    <BannerInline
                        testID="@earn/balance-card/incomplete-fiat-total"
                        intent="warning"
                        title={
                            <Translation id="earn.earnScreen.depositsCard.incompleteFiatTotal" />
                        }
                        buttonLabel={<Translation id="generic.buttons.retry" />}
                        buttonProps={{ priority: 'secondary' }}
                        onButtonPress={() => void retryMissingFiatRates()}
                    />
                )}
            </VStack>
        </Card>
    );
};
