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
import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';

type BuyCardProps = {
    isAmountInputActive: boolean;
};

const buySectionStyle = prepareNativeStyle<{ bottomBorder: boolean }>(
    ({ borders, colors, spacings }, { bottomBorder }) => ({
        borderBottomWidth: bottomBorder ? borders.widths.small : 0,
        borderBottomColor: colors.backgroundSurfaceElevation0,
        paddingHorizontal: spacings.sp12,
        paddingTop: spacings.sp16,
        paddingBottom: spacings.sp12,
        gap: spacings.sp8,
    }),
);

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
    const { watch } = useTradingBuyFormContext();

    const asset = watch('asset');

    return (
        <AnimatedBox entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
            <AnimatedCard style={animatedStyle} noPadding>
                <VStack
                    style={applyStyle(buySectionStyle, { bottomBorder: true })}
                    testID="@trading/buyCard/fiatSection"
                >
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
                <VStack
                    style={applyStyle(buySectionStyle, { bottomBorder: !!asset })}
                    testID="@trading/buyCard/cryptoSection"
                >
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
                        spacing="sp4"
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
