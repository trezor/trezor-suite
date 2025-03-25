import { useFormatters } from '@suite-common/formatters';
import { Card, HStack, Text, VStack } from '@suite-native/atoms';
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
    const { FiatAmountFormatter } = useFormatters();
    const { applyStyle } = useNativeStyles();

    const [fiatAmount, selectedReceiveAccount] = form.watch(['fiatValue', 'receiveAccount']);
    const selectedNetworkSymbol = getSelectedSymbolFromBuyForm(form);

    return (
        <Card noPadding>
            <VStack style={applyStyle(buySectionStyle)}>
                <Text variant="body" color="textDefault">
                    <Translation id="moduleTrading.selectFiat.title" />
                </Text>
                <HStack justifyContent="space-between" alignItems="center">
                    <FiatCurrencyPicker form={form} />
                    <Text variant="titleMedium" color="textDisabled">
                        {fiatAmount ? <FiatAmountFormatter value={fiatAmount} /> : '0.0'}
                    </Text>
                </HStack>
            </VStack>
            <VStack style={applyStyle(buySectionStyle)}>
                <Text variant="body" color="textDefault">
                    <Translation id="moduleTrading.selectCoin.title" />
                </Text>
                <HStack justifyContent="space-between" alignItems="center">
                    <TradeableAssetPicker form={form} />
                    <Text variant="titleMedium" color="textDisabled">
                        0.0
                    </Text>
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
    );
};
