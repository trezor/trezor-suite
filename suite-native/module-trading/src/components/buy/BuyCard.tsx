import { Platform } from 'react-native';
import {
    FadeIn,
    LinearTransition,
    interpolateColor,
    useAnimatedStyle,
    useDerivedValue,
    withTiming,
} from 'react-native-reanimated';

import { AnimatedBox, AnimatedCard, Box, HStack, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { BuyAssetNetworkInfo } from './BuyAssetNetworkInfo';
import { BuyCardTitle } from './BuyCardTitle';
import { BuyFiatCurrencyPicker } from './BuyFiatCurrencyPicker';
import { BuyFormFieldErrorBadge } from './BuyFormFieldErrorBadge';
import { BuyReceiveAccountCryptoBalance } from './BuyReceiveAccountCryptoBalance';
import { BuyReceiveAccountPicker } from './BuyReceiveAccountPicker';
import { BuyTradeableAssetPicker } from './BuyTradeableAssetPicker';
import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';

type BuyCardProps = {
    isAmountInputActive: boolean;
    shouldAnimateEntering?: boolean;
};

const BUY_CARD_TEST_ID = '@trading/buyCard';

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

export const BuyCard = ({ isAmountInputActive, shouldAnimateEntering }: BuyCardProps) => {
    const { applyStyle } = useNativeStyles();
    const animatedStyle = useAnimatedBorderStyle(isAmountInputActive);
    const { watch } = useBuyFormContext();

    const asset = watch('asset');

    // on android fade animation looks ugly on view with shadows, better to skip it
    const enteringAnimation = shouldAnimateEntering && Platform.OS === 'ios' ? FadeIn : undefined;

    return (
        <AnimatedBox entering={enteringAnimation} layout={LinearTransition}>
            <AnimatedCard style={animatedStyle} noPadding>
                <VStack
                    style={applyStyle(buySectionStyle, { bottomBorder: true })}
                    testID={BUY_CARD_TEST_ID + '/fiatSection'}
                >
                    <HStack justifyContent="space-between" alignItems="center">
                        <BuyCardTitle>
                            <Translation id="moduleTrading.selectFiat.title" />
                        </BuyCardTitle>
                        <Box alignItems="flex-end">
                            <BuyFormFieldErrorBadge fieldName="fiatValue" />
                        </Box>
                    </HStack>
                    <BuyFiatCurrencyPicker />
                </VStack>
                <VStack
                    style={applyStyle(buySectionStyle, { bottomBorder: !!asset })}
                    testID={BUY_CARD_TEST_ID + '/cryptoSection'}
                >
                    <HStack justifyContent="space-between" alignItems="center">
                        <BuyCardTitle>
                            <Translation id="moduleTrading.selectCoin.title" />
                        </BuyCardTitle>
                        <BuyFormFieldErrorBadge fieldName="cryptoValue" />
                    </HStack>
                    <BuyTradeableAssetPicker />
                    <HStack
                        justifyContent="space-between"
                        alignItems="center"
                        paddingVertical="sp4"
                        spacing="sp4"
                    >
                        <BuyAssetNetworkInfo />
                        <BuyReceiveAccountCryptoBalance />
                    </HStack>
                </VStack>
                <BuyReceiveAccountPicker />
            </AnimatedCard>
        </AnimatedBox>
    );
};
