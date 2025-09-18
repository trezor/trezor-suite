import Animated, { FadeIn } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { ExchangeTrade, SellFiatTrade } from 'invity-api';

import {
    TradingRootState,
    isExchangeTrade,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { Text, VStack } from '@suite-native/atoms';
import { splitAddressToChunks } from '@suite-native/helpers';
import { Translation, useTranslate } from '@suite-native/intl';

import { TradeInfoRow } from '../TradeInfo/TradeInfoRow';

export const ProviderReceiveAddress = ({ trade }: { trade: ExchangeTrade | SellFiatTrade }) => {
    const { translate } = useTranslate();
    const tradeType = isExchangeTrade(trade) ? 'exchange' : 'sell';
    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, trade.exchange, tradeType),
    );

    const providerName =
        providerInfo?.companyName ??
        translate('moduleTrading.tradingExchangePreviewScreen.providerNamePlaceholder');

    const receiveAddress =
        tradeType === 'exchange'
            ? (trade as ExchangeTrade).sendAddress
            : (trade as SellFiatTrade).destinationAddress;

    if (!receiveAddress) {
        return null;
    }

    return (
        <Animated.View entering={FadeIn}>
            <TradeInfoRow>
                <VStack spacing="sp4">
                    <Text variant="hint">
                        <Translation
                            id="moduleTrading.tradingExchangePreviewScreen.providerReceiveAddressLabel"
                            values={{ providerName }}
                        />
                    </Text>
                    <Text variant="hint" color="textSubdued">
                        {splitAddressToChunks(receiveAddress ?? '').join(' ')}
                    </Text>
                </VStack>
            </TradeInfoRow>
        </Animated.View>
    );
};
