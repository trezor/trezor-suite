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
import { AnimatedBox, Text, VStack } from '@suite-native/atoms';
import { AddressFormatter } from '@suite-native/formatters';
import { Translation, useTranslate } from '@suite-native/intl';
import { SkeletonSmall, TradeInfoRow } from '@suite-native/trading-atoms';

export const ProviderReceiveAddress = ({ trade }: { trade: ExchangeTrade | SellFiatTrade }) => {
    const { translate } = useTranslate();
    const tradeType = isExchangeTrade(trade) ? 'exchange' : 'sell';
    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, trade.exchange, tradeType),
    );
    const sendAccountKey = useSelector((state: TradingRootState) =>
        tradeType === 'exchange'
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
            ? ((trade as ExchangeTrade).sendAddress ?? (trade as ExchangeTrade)?.dexTx?.to)
            : (trade as SellFiatTrade).destinationAddress;

    if (!networkType) {
        return null;
    }

    const addressTitle =
        tradeType === 'exchange' && (trade as ExchangeTrade).isDex ? (
            <Translation
                id="moduleTrading.tradingExchangePreviewScreen.providerContractAddressLabel"
                values={{ providerName }}
            />
        ) : (
            <Translation
                id="moduleTrading.tradingExchangePreviewScreen.providerReceiveAddressLabel"
                values={{ providerName }}
            />
        );

    return (
        <Animated.View entering={FadeIn}>
            <TradeInfoRow>
                <VStack spacing="sp4">
                    <Text variant="body-sm">{addressTitle}</Text>
                    {receiveAddress ? (
                        <AnimatedBox entering={FadeIn}>
                            <AddressFormatter
                                value={receiveAddress}
                                format="full"
                                variant="body-sm"
                                color="contentSecondary"
                            />
                        </AnimatedBox>
                    ) : (
                        <VStack spacing="sp12">
                            <SkeletonSmall widthPercentage={0.8} height={14} />
                            <SkeletonSmall widthPercentage={0.3} height={14} />
                        </VStack>
                    )}
                </VStack>
            </TradeInfoRow>
        </Animated.View>
    );
};
