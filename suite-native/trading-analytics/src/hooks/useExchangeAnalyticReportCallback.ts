import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import type { ExchangeProviderInfo, ExchangeTrade } from 'invity-api';

import {
    type TradingRootState,
    cryptoIdToNetwork,
    selectTradingCoinInfoByCryptoId,
    selectTradingExchangeSelectedQuote,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import {
    type TradingExchangeAction,
    type TradingExchangeStep,
    events,
} from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';
import { coinInfoToTradeableAsset } from '@suite-native/trading-atoms';

export type TradingExchangeAnalyticReportCallback = (
    step: TradingExchangeStep,
    action: TradingExchangeAction,
) => void;

const useExchangeFormAnalyticsPayload = (quote: ExchangeTrade | undefined) => {
    const { send, receive, exchange } = quote || {};

    const sendCoinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, send),
    );
    const receiveCoinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, receive),
    );
    const isFixedRate = useSelector(
        (state: TradingRootState) =>
            (
                selectTradingProviderByNameAndTradeType(state, exchange, 'exchange') as
                    | ExchangeProviderInfo
                    | undefined
            )?.isFixedRate,
    );

    if (
        !quote ||
        !sendCoinInfo ||
        !receiveCoinInfo ||
        !send ||
        !receive ||
        isFixedRate === undefined
    ) {
        return {};
    }

    const sendAsset = coinInfoToTradeableAsset(send, sendCoinInfo);
    const receiveAsset = coinInfoToTradeableAsset(receive, receiveCoinInfo);

    if (!sendAsset || !receiveAsset) {
        return {};
    }
    const { isDex, approvalType, swapSlippage } = quote;

    return {
        sendCryptoLabel: sendAsset.symbol,
        sendCryptoNetworkSymbol: cryptoIdToNetwork(send)?.symbol,
        sendCryptoContractAddress: sendAsset.contractAddress,

        receiveCryptoLabel: receiveAsset.symbol,
        receiveCryptoNetworkSymbol: cryptoIdToNetwork(receive)?.symbol,
        receiveCryptoContractAddress: receiveAsset.contractAddress,

        exchangeName: exchange,
        exchangeType: isDex ? 'DEX' : 'CEX',

        approvalType,
        slippage: swapSlippage,
        rateType: isFixedRate ? 'fixed' : 'floating',
    };
};

export const useExchangeAnalyticReportCallback = (
    candidateQuote?: ExchangeTrade,
): TradingExchangeAnalyticReportCallback => {
    const persistedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const quote = candidateQuote || persistedQuote;
    const analytics = useAnalytics();
    const {
        exchangeName,
        exchangeType,
        approvalType,
        rateType,
        receiveCryptoContractAddress,
        receiveCryptoLabel,
        sendCryptoContractAddress,
        receiveCryptoNetworkSymbol,
        sendCryptoNetworkSymbol,
        sendCryptoLabel,
        slippage,
    } = useExchangeFormAnalyticsPayload(quote);

    return useCallback(
        (step: TradingExchangeStep, action: TradingExchangeAction) => {
            analytics.report({
                type: events.tradingExchangeEvent.name,
                payload: {
                    step,
                    action,
                    exchangeName,
                    exchangeType,
                    approvalType,
                    rateType,
                    receiveCryptoContractAddress,
                    receiveCryptoLabel,
                    sendCryptoContractAddress,
                    receiveCryptoNetworkSymbol,
                    sendCryptoNetworkSymbol,
                    sendCryptoLabel,
                    slippage,
                },
            });
        },
        [
            analytics,
            exchangeName,
            exchangeType,
            approvalType,
            rateType,
            receiveCryptoContractAddress,
            receiveCryptoLabel,
            sendCryptoContractAddress,
            receiveCryptoNetworkSymbol,
            sendCryptoNetworkSymbol,
            sendCryptoLabel,
            slippage,
        ],
    );
};
