import { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { AnimatedBox, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { CryptoAmountInput } from './CryptoAmountInput';
import { FiatAmountInput } from './FiatAmountInput';
import { FiatCurrencyPicker } from './FiatCurrencyPicker';
import { ReceiveAccountCryptoBalance } from './ReceiveAccountCryptoBalance';
import { ReceiveAccountPicker } from './ReceiveAccountPicker';
import { TradeableAssetPicker } from './TradeableAssetPicker';
import { TradingBuyForm } from '../../types';
import { getSelectedSymbolFromBuyForm } from '../../utils/tradeableAssetUtils';

type BuyCardProps = {
    form: TradingBuyForm;
};

const buySectionStyle = prepareNativeStyle(({ borders, colors, spacings }) => ({
    borderBottomWidth: borders.widths.small,
    borderBottomColor: colors.backgroundSurfaceElevation0,
    paddingHorizontal: spacings.sp20,
    paddingTop: spacings.sp16,
    paddingBottom: spacings.sp12,
    gap: spacings.sp8,
}));

export const BuyCard = ({ form }: BuyCardProps) => {
    const { applyStyle } = useNativeStyles();

    const [selectedReceiveAccount] = form.watch(['receiveAccount']);
    const selectedNetworkSymbol = getSelectedSymbolFromBuyForm(form);

    return (
        <AnimatedBox entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
            <Card noPadding>
                <VStack style={applyStyle(buySectionStyle)}>
                    <Text variant="body" color="textDefault">
                        <Translation id="moduleTrading.selectFiat.title" />
                    </Text>
                    <HStack justifyContent="space-between" alignItems="center">
                        <FiatCurrencyPicker form={form} />
                        <FiatAmountInput />
                    </HStack>
                </VStack>
                <VStack style={applyStyle(buySectionStyle)}>
                    <Text variant="body" color="textDefault">
                        <Translation id="moduleTrading.selectCoin.title" />
                    </Text>
                    <HStack justifyContent="space-between" alignItems="center">
                        <TradeableAssetPicker form={form} />
                        <CryptoAmountInput />
                    </HStack>
                    <HStack justifyContent="space-between" alignItems="center">
                        <ReceiveAccountCryptoBalance
                            symbol={selectedReceiveAccount?.account?.symbol}
                            balance={selectedReceiveAccount?.account?.balance}
                        />
                    </HStack>
                </VStack>
                <ReceiveAccountPicker selectedSymbol={selectedNetworkSymbol} />
            </Card>
        </AnimatedBox>
    );
};
