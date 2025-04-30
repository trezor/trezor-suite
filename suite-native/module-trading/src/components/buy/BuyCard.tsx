import {
    FadeIn,
    FadeOut,
    LinearTransition,
    interpolateColor,
    useAnimatedStyle,
    useDerivedValue,
    withTiming,
} from 'react-native-reanimated';

import { AnimatedBox, AnimatedCard, Box, HStack, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AssetNetworkInfo } from './AssetNetworkInfo';
import { BuyCardTitle } from './BuyCardTitle';
import { BuyFormFieldErrorBadge } from './BuyFormFieldErrorBadge';
import { FiatCurrencyPicker } from './FiatCurrencyPicker';
import { ReceiveAccountCryptoBalance } from './ReceiveAccountCryptoBalance';
import { ReceiveAccountPicker } from './ReceiveAccountPicker';
import { TradeableAssetPicker } from './TradeableAssetPicker';

type BuyCardProps = {
    isAmountInputActive: boolean;
};

const buySectionStyle = prepareNativeStyle(({ borders, colors, spacings }) => ({
    borderBottomWidth: borders.widths.small,
    borderBottomColor: colors.backgroundSurfaceElevation0,
    paddingHorizontal: spacings.sp12,
    paddingTop: spacings.sp16,
    paddingBottom: spacings.sp12,
    gap: spacings.sp8,
}));

const useAnimatedBorderStyle = (isAmountInputActive: boolean) => {
    const { utils } = useNativeStyles();
    const progress = useDerivedValue(() => withTiming(isAmountInputActive ? 1 : 0));

    return useAnimatedStyle(() => ({
        borderColor: interpolateColor(
            progress.value,
            [0, 1],
            [utils.colors.backgroundSurfaceElevation1, utils.colors.borderInputDefault],
        ) as `rgba(${number}, ${number}, ${number}, ${number})`,
        borderWidth: utils.borders.widths.large,
    }));
};

export const BuyCard = ({ isAmountInputActive }: BuyCardProps) => {
    const { applyStyle } = useNativeStyles();
    const animatedStyle = useAnimatedBorderStyle(isAmountInputActive);

    return (
        <AnimatedBox entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
            <AnimatedCard style={animatedStyle} noPadding>
                <VStack style={applyStyle(buySectionStyle)}>
                    <HStack justifyContent="space-between" alignItems="center">
                        <BuyCardTitle>
                            <Translation id="moduleTrading.selectFiat.title" />
                        </BuyCardTitle>
                        <Box alignItems="flex-end">
                            <BuyFormFieldErrorBadge fieldName="fiatValue" />
                        </Box>
                    </HStack>
                    <FiatCurrencyPicker />
                </VStack>
                <VStack style={applyStyle(buySectionStyle)}>
                    <HStack justifyContent="space-between" alignItems="center">
                        <BuyCardTitle>
                            <Translation id="moduleTrading.selectCoin.title" />
                        </BuyCardTitle>
                        <BuyFormFieldErrorBadge fieldName="cryptoValue" />
                    </HStack>
                    <TradeableAssetPicker />
                    <HStack
                        justifyContent="space-between"
                        alignItems="center"
                        paddingVertical="sp4"
                    >
                        <AssetNetworkInfo />
                        <ReceiveAccountCryptoBalance />
                    </HStack>
                </VStack>
                <ReceiveAccountPicker />
            </AnimatedCard>
        </AnimatedBox>
    );
};
