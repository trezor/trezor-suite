import { Card, HStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ExchangeReceiveAccountCryptoBalance } from './ExchangeReceiveAccountCryptoBalance';
import { ExchangeTradeableAssetPicker } from './ExchangeTradeableAssetPicker';
import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { CardTitle } from '../general/CardTitle';
import { FiatAmountBadge } from '../general/FiatAmountBadge';
import { TradeableAssetNetworkInfo } from '../general/TradeableAssetNetworkInfo';

const nonEditableCard = prepareNativeStyle(({ colors, borders }) => ({
    backgroundColor: colors.backgroundSurfaceElevation0,
    borderColor: colors.borderElevation0,
    borderWidth: borders.widths.small,
}));

export const ExchangeBuyCard = () => {
    const { applyStyle } = useNativeStyles();
    const { watch } = useExchangeFormContext();

    const asset = watch('receiveAsset');

    return (
        <Card style={applyStyle(nonEditableCard)}>
            <HStack justifyContent="space-between" alignItems="center">
                <CardTitle>
                    <Translation id="moduleTrading.selectCoin.title" />
                </CardTitle>
                <FiatAmountBadge amount="123" />
            </HStack>
            <ExchangeTradeableAssetPicker />
            <HStack
                justifyContent="space-between"
                alignItems="center"
                paddingVertical="sp4"
                spacing="sp4"
            >
                <TradeableAssetNetworkInfo asset={asset} />
                <ExchangeReceiveAccountCryptoBalance />
            </HStack>
        </Card>
    );
};
