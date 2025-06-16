import { Platform } from 'react-native';
import { FadeIn, LinearTransition } from 'react-native-reanimated';

import { AnimatedBox, AnimatedCard, Box, HStack, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { BuyFiatCurrencyPicker } from './BuyFiatCurrencyPicker';
import { BuyFormFieldErrorBadge } from './BuyFormFieldErrorBadge';
import { BuyReceiveAccountCryptoBalance } from './BuyReceiveAccountCryptoBalance';
import { BuyReceiveAccountPicker } from './BuyReceiveAccountPicker';
import { BuyTradeableAssetPicker } from './BuyTradeableAssetPicker';
import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useAnimatedBorderStyle } from '../../hooks/general/useAnimatedBorderStyle';
import { CardTitle } from '../general/CardTitle';
import { TradeableAssetNetworkInfo } from '../general/TradeableAssetNetworkInfo';

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
                        <CardTitle>
                            <Translation id="moduleTrading.selectFiat.title" />
                        </CardTitle>
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
                        <CardTitle>
                            <Translation id="moduleTrading.selectCoin.title" />
                        </CardTitle>
                        <BuyFormFieldErrorBadge fieldName="cryptoValue" />
                    </HStack>
                    <BuyTradeableAssetPicker />
                    <HStack
                        justifyContent="space-between"
                        alignItems="center"
                        paddingVertical="sp4"
                        spacing="sp4"
                    >
                        <TradeableAssetNetworkInfo asset={asset} />
                        <BuyReceiveAccountCryptoBalance />
                    </HStack>
                </VStack>
                <BuyReceiveAccountPicker />
            </AnimatedCard>
        </AnimatedBox>
    );
};
