import {
    FadeIn,
    FadeOut,
    LinearTransition,
    interpolateColor,
    useAnimatedStyle,
    useDerivedValue,
    withTiming,
} from 'react-native-reanimated';

import { AnimatedBox, AnimatedCard, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { FiatCurrencyPicker } from './FiatCurrencyPicker';
import { ReceiveAccountCryptoBalance } from './ReceiveAccountCryptoBalance';
import { ReceiveAccountPicker } from './ReceiveAccountPicker';
import { TradeableAssetPicker } from './TradeableAssetPicker';
import { TradingBuyForm } from '../../types';
import { getSelectedSymbolFromBuyForm } from '../../utils/tradeableAssetUtils';

type BuyCardProps = {
    form: TradingBuyForm;
    isAmountInputActive: boolean;
};

const buySectionStyle = prepareNativeStyle(({ borders, colors, spacings }) => ({
    borderBottomWidth: borders.widths.small,
    borderBottomColor: colors.backgroundSurfaceElevation0,
    paddingHorizontal: spacings.sp20,
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

export const BuyCard = ({ form, isAmountInputActive }: BuyCardProps) => {
    const { applyStyle } = useNativeStyles();
    const animatedStyle = useAnimatedBorderStyle(isAmountInputActive);

    const [selectedReceiveAccount] = form.watch(['receiveAccount']);
    const selectedNetworkSymbol = getSelectedSymbolFromBuyForm(form);

    return (
        <AnimatedBox entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
            <AnimatedCard style={animatedStyle} noPadding>
                <VStack style={applyStyle(buySectionStyle)}>
                    <Text variant="body" color="textDefault">
                        <Translation id="moduleTrading.selectFiat.title" />
                    </Text>
                    <FiatCurrencyPicker />
                </VStack>
                <VStack style={applyStyle(buySectionStyle)}>
                    <Text variant="body" color="textDefault">
                        <Translation id="moduleTrading.selectCoin.title" />
                    </Text>
                    <TradeableAssetPicker />
                    <HStack justifyContent="space-between" alignItems="center">
                        <ReceiveAccountCryptoBalance
                            symbol={selectedReceiveAccount?.account?.symbol}
                            balance={selectedReceiveAccount?.account?.balance}
                        />
                    </HStack>
                </VStack>
                <ReceiveAccountPicker selectedSymbol={selectedNetworkSymbol} />
            </AnimatedCard>
        </AnimatedBox>
    );
};
