import { type BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

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

const getBarFlex = (value: string, total: string) => {
    const hasTotal = new BigNumber(total).isGreaterThan(0);

    if (!hasTotal) return 1;

    return Math.max(new BigNumber(value).dividedBy(total).toNumber(), MIN_BALANCE_SEGMENT_FLEX);
};

interface EarnBalanceLegendItemProps {
    amount: BaseCurrencyAmount;
    color: Color;
    title: React.ReactNode;
}

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

type EarnBalanceBreakdownProps = {
    totalStakingFiatAmount: string;
    totalYieldFiatAmount: string;
    totalEarnFiatAmount: string;
};

export const EarnBalanceBreakdown = ({
    totalStakingFiatAmount,
    totalYieldFiatAmount,
    totalEarnFiatAmount,
}: EarnBalanceBreakdownProps) => {
    const { applyStyle } = useNativeStyles();

    const stakingBarFlex = getBarFlex(totalStakingFiatAmount, totalEarnFiatAmount);
    const yieldBarFlex = getBarFlex(totalYieldFiatAmount, totalEarnFiatAmount);

    return (
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
                        flex: yieldBarFlex,
                    })}
                />
            </Box>

            <HStack spacing="sp16" justifyContent="space-between">
                <EarnBalanceLegendItem
                    amount={asBaseCurrencyAmount(new BigNumber(totalStakingFiatAmount))}
                    color="contentBrand"
                    title={<Translation id="earn.staking" />}
                />
                <EarnBalanceLegendItem
                    amount={asBaseCurrencyAmount(new BigNumber(totalYieldFiatAmount))}
                    color="elementFillBrandBold"
                    title={<Translation id="earn.defiYield" />}
                />
            </HStack>
        </VStack>
    );
};
