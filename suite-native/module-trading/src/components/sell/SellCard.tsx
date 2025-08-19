import { Platform } from 'react-native';
import { FadeIn, LinearTransition } from 'react-native-reanimated';

import { AnimatedBox, AnimatedCard, Box, HStack, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { SellFormFieldErrorBadge } from './SellFormFieldErrorBadge';
import { SellFiatCurrencyPicker } from './fiat/SellFiatCurrencyPicker';
import { useAnimatedBorderStyle } from '../../hooks/general/useAnimatedBorderStyle';
import { useSellFormContext } from '../../hooks/sell/useSellFormContext';
import { CardTitle } from '../general/CardTitle';
import { SellSendAccountCryptoBalance } from './send/SellSendAccountCryptoBalance';
import { SellSendAssetPicker } from './send/SellSendAssetPicker';
import { TradeableAssetNetworkInfo } from '../general/TradeableAssetNetworkInfo';

type SellCardProps = {
    isAmountInputActive: boolean;
    shouldAnimateEntering?: boolean;
};

const SELL_CARD_TEST_ID = '@trading/sellCard';

const sellSectionStyle = prepareNativeStyle<{ bottomBorder: boolean }>(
    ({ borders, colors, spacings }, { bottomBorder }) => ({
        borderBottomWidth: bottomBorder ? borders.widths.small : 0,
        borderBottomColor: colors.backgroundSurfaceElevation0,
        paddingHorizontal: spacings.sp12,
        paddingTop: spacings.sp16,
        paddingBottom: spacings.sp12,
        gap: spacings.sp8,
    }),
);

export const SellCard = ({ isAmountInputActive, shouldAnimateEntering }: SellCardProps) => {
    const { applyStyle } = useNativeStyles();
    const animatedStyle = useAnimatedBorderStyle(isAmountInputActive);
    const { watch } = useSellFormContext();

    const asset = watch('sendAsset');

    // on android fade animation looks ugly on view with shadows, better to skip it
    const enteringAnimation = shouldAnimateEntering && Platform.OS === 'ios' ? FadeIn : undefined;

    return (
        <AnimatedBox entering={enteringAnimation} layout={LinearTransition}>
            <AnimatedCard style={animatedStyle} noPadding>
                <VStack style={applyStyle(sellSectionStyle, { bottomBorder: true })}>
                    <HStack
                        justifyContent="space-between"
                        alignItems="center"
                        testID={SELL_CARD_TEST_ID + '/cryptoSection'}
                    >
                        <CardTitle>
                            <Translation id="moduleTrading.selectCoinToSell.title" />
                        </CardTitle>
                    </HStack>
                    <SellSendAssetPicker />
                    <HStack
                        justifyContent="space-between"
                        alignItems="center"
                        paddingVertical="sp4"
                        spacing="sp4"
                    >
                        <TradeableAssetNetworkInfo asset={asset} />
                        <SellSendAccountCryptoBalance />
                    </HStack>
                </VStack>
                <VStack style={applyStyle(sellSectionStyle, { bottomBorder: true })}>
                    <HStack
                        justifyContent="space-between"
                        alignItems="center"
                        testID={SELL_CARD_TEST_ID + '/fiatSection'}
                    >
                        <CardTitle>
                            <Translation id="moduleTrading.selectFiat.sell.title" />
                        </CardTitle>
                        <Box alignItems="flex-end">
                            <SellFormFieldErrorBadge fieldName="fiatStringAmount" />
                        </Box>
                    </HStack>
                    <SellFiatCurrencyPicker />
                </VStack>
            </AnimatedCard>
        </AnimatedBox>
    );
};
