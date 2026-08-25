import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { BannerInline, Box, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

const MIN_BALANCE_SEGMENT_FLEX = 0.05;

const balanceBarStyle = prepareNativeStyle(_ => ({
    flexDirection: 'row',
    gap: 4,
}));

const balanceBarSegmentStyle = prepareNativeStyle<{ color: Color; flex: number }>(
    (utils, { color, flex }) => ({
        flex,
        height: 4,
        borderRadius: utils.borders.radii.r4,
        backgroundColor: utils.colors[color],
    }),
);

const legendDotStyle = prepareNativeStyle<{ color: Color }>((utils, { color }) => ({
    width: 6,
    height: 6,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors[color],
}));

type EarnBalanceLegendItemProps = {
    amount: BaseCurrencyAmount;
    color: Color;
    title: React.ReactNode;
};

const EarnBalanceLegendItem = ({ amount, color, title }: EarnBalanceLegendItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack spacing="sp4" alignItems="center" flexShrink={1}>
            <Box style={applyStyle(legendDotStyle, { color })} />
            <Text variant="body-sm" color="contentSecondary" numberOfLines={1}>
                {title}{' '}
                <BaseCurrencyAmountFormatter
                    value={amount}
                    variant="body-sm"
                    color="contentSecondary"
                    isDiscreetText={false}
                />
            </Text>
        </HStack>
    );
};

type EarnBalanceCardProps = {
    totalFiatAmount: BaseCurrencyAmount;
    stakingFiatAmount: BaseCurrencyAmount;
    stablecoinYieldFiatAmount: BaseCurrencyAmount;
    isFiatRatesLoading: boolean;
    isFiatTotalIncomplete: boolean;
    isFiatTotalUnavailable: boolean;
    shouldShowBreakdown: boolean;
    onRetryMissingFiatRates: () => void;
};

export const EarnBalanceCard = ({
    totalFiatAmount,
    stakingFiatAmount,
    stablecoinYieldFiatAmount,
    isFiatRatesLoading,
    isFiatTotalIncomplete,
    isFiatTotalUnavailable,
    shouldShowBreakdown,
    onRetryMissingFiatRates,
}: EarnBalanceCardProps) => {
    const { applyStyle } = useNativeStyles();
    const breakdownTotal = stakingFiatAmount.plus(stablecoinYieldFiatAmount);
    const hasBreakdownAmounts = breakdownTotal.isGreaterThan(0);
    const stakingBarFlex = hasBreakdownAmounts
        ? Math.max(stakingFiatAmount.dividedBy(breakdownTotal).toNumber(), MIN_BALANCE_SEGMENT_FLEX)
        : 1;
    const stablecoinYieldBarFlex = hasBreakdownAmounts
        ? Math.max(
              stablecoinYieldFiatAmount.dividedBy(breakdownTotal).toNumber(),
              MIN_BALANCE_SEGMENT_FLEX,
          )
        : 1;
    const isBreakdownAvailable =
        shouldShowBreakdown &&
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
                                value={totalFiatAmount}
                                variant="headline-md"
                                isDiscreetText={false}
                                isLoading={isFiatRatesLoading}
                            />
                        </HStack>
                    )}
                </VStack>

                {isBreakdownAvailable && (
                    <VStack spacing="sp12" testID="@earn/balance-card/breakdown">
                        <Box style={applyStyle(balanceBarStyle)}>
                            <Box
                                style={applyStyle(balanceBarSegmentStyle, {
                                    color: 'contentBrand',
                                    flex: stakingBarFlex,
                                })}
                            />
                            <Box
                                style={applyStyle(balanceBarSegmentStyle, {
                                    color: 'elementFillBrandBold',
                                    flex: stablecoinYieldBarFlex,
                                })}
                            />
                        </Box>
                        <HStack spacing="sp16" justifyContent="space-between">
                            <EarnBalanceLegendItem
                                amount={stakingFiatAmount}
                                color="contentBrand"
                                title={<Translation id="earn.staking" />}
                            />
                            <EarnBalanceLegendItem
                                amount={stablecoinYieldFiatAmount}
                                color="elementFillBrandBold"
                                title={<Translation id="earn.defiYield" />}
                            />
                        </HStack>
                    </VStack>
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
                        onButtonPress={onRetryMissingFiatRates}
                    />
                )}
            </VStack>
        </Card>
    );
};
