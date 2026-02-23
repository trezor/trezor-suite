import { Card, HStack, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { CardTitle } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ExchangeReceiveAccountCryptoBalance } from './ExchangeReceiveAccountCryptoBalance';
import { ExchangeTradeableAssetPicker } from './ExchangeTradeableAssetPicker';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { CryptoToFiatValueBadge } from '../../general/CryptoToFiatValueBadge';
import { TradeableAssetNetworkInfo } from '../../general/TradeableAssetNetworkInfo';

const nonEditableCardStyle = prepareNativeStyle(({ colors, borders }) => ({
    backgroundColor: colors.backgroundSurfaceElevation0,
    borderColor: colors.borderElevation0,
    borderWidth: borders.widths.small,
}));

export const ExchangeReceiveCard = () => {
    const { applyStyle } = useNativeStyles();
    const { watch } = useExchangeFormContext();

    const [asset, cryptoAmount] = watch(['receiveAsset', 'receiveCryptoAmount']);

    return (
        <Card style={applyStyle(nonEditableCardStyle)}>
            <VStack>
                <HStack justifyContent="space-between" alignItems="center">
                    <CardTitle>
                        <Translation id="moduleTrading.selectCoin.title" />
                    </CardTitle>
                    <CryptoToFiatValueBadge cryptoId={asset?.cryptoId} amount={cryptoAmount} />
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
            </VStack>
        </Card>
    );
};
