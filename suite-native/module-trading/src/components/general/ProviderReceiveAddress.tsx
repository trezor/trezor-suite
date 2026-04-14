import Animated, { FadeIn } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import type { ExchangeTrade, SellFiatTrade } from 'invity-api';

import {
    type TradingRootState,
    isExchangeTrade,
    selectTradingExchangeAccountKey,
    selectTradingProviderByNameAndTradeType,
    selectTradingSellAccountKey,
} from '@suite-common/trading';
import { type AccountsRootState, selectAccountNetworkType } from '@suite-common/wallet-core';
import { Text, VStack } from '@suite-native/atoms';
import { splitAddressToChunks } from '@suite-native/helpers';
import { Translation, useTranslate } from '@suite-native/intl';
import { TradeInfoRow } from '@suite-native/trading-atoms';

export const ProviderReceiveAddress = ({ trade }: { trade: ExchangeTrade | SellFiatTrade }) => {
    const { translate } = useTranslate();
    const tradeType = isExchangeTrade(trade) ? 'exchange' : 'sell';
    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, trade.exchange, tradeType),
    );
    const sendAccountKey = useSelector((state: TradingRootState) =>
        isExchangeTrade(trade)
            ? selectTradingExchangeAccountKey(state)
            : selectTradingSellAccountKey(state),
    );

    const networkType = useSelector((state: AccountsRootState) =>
        sendAccountKey ? selectAccountNetworkType(state, sendAccountKey) : null,
    );

    const providerName =
        providerInfo?.companyName ??
        translate('moduleTrading.tradingExchangePreviewScreen.providerNamePlaceholder');

    const receiveAddress =
        tradeType === 'exchange'
            ? (trade as ExchangeTrade).sendAddress
            : (trade as SellFiatTrade).destinationAddress;

    if (!receiveAddress || !networkType) {
        return null;
    }

    const addressText =
        networkType === 'solana'
            ? receiveAddress
            : splitAddressToChunks(receiveAddress ?? '').join(' ');

    return (
        <Animated.View entering={FadeIn}>
            <TradeInfoRow>
                <VStack spacing="sp4">
                    <Text variant="body-sm">
                        <Translation
                            id="moduleTrading.tradingExchangePreviewScreen.providerReceiveAddressLabel"
                            values={{ providerName }}
                        />
                    </Text>
                    <Text variant="body-sm" color="contentSecondary">
                        {addressText}
                    </Text>
                </VStack>
            </TradeInfoRow>
        </Animated.View>
    );
};
