import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import type { BuyTrade } from 'invity-api';

import { useServices } from '@suite-common/dependency-injection';
import {
    type TradingRootState,
    selectTradingBuySelectedQuote,
    selectTradingCoinInfoByCryptoId,
} from '@suite-common/trading';
import {
    type TradingBuyAction,
    type TradingBuyStep,
    events,
    selectNativeAnalyticsDep,
} from '@suite-native/analytics';

import { getAnalyticsTradingBuyPayload } from '../utils/quotesUtils';

export type TradingBuyAnalyticReportCallback = (
    step: TradingBuyStep,
    action: TradingBuyAction,
) => void;

export const useBuyAnalyticReportCallback = (
    candidateQuote?: BuyTrade,
): TradingBuyAnalyticReportCallback => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const persistedQuote = useSelector(selectTradingBuySelectedQuote);
    const quote = candidateQuote || persistedQuote;

    const coinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, quote?.receiveCurrency),
    );

    const quoteAnalyticsData = getAnalyticsTradingBuyPayload({
        quote,
        coinInfo,
    });

    return useCallback(
        (step: TradingBuyStep, action: TradingBuyAction) => {
            analytics.report({
                type: events.tradingBuyEvent.name,
                payload: {
                    step,
                    action,
                    ...(quoteAnalyticsData || {}),
                },
            });
        },
        [analytics, quoteAnalyticsData],
    );
};
