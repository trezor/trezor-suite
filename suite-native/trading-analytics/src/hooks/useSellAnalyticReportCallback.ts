import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import type { SellFiatTrade } from 'invity-api';

import { useServices } from '@suite-common/dependency-injection';
import {
    type TradingRootState,
    selectTradingCoinInfoByCryptoId,
    selectTradingSellSelectedQuote,
} from '@suite-common/trading';
import {
    type TradingSellAction,
    type TradingSellStep,
    events,
    selectNativeAnalyticsDep,
} from '@suite-native/analytics';

import { getAnalyticsTradingSellPayload } from '../utils/quotesUtils';

export type TradingSellAnalyticReportCallback = (
    step: TradingSellStep,
    action: TradingSellAction,
) => void;

export const useSellAnalyticReportCallback = (
    candidateQuote?: SellFiatTrade,
): TradingSellAnalyticReportCallback => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const persistedQuote = useSelector(selectTradingSellSelectedQuote);
    const quote = candidateQuote || persistedQuote;

    const coinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, quote?.cryptoCurrency),
    );

    const quoteAnalyticsData = getAnalyticsTradingSellPayload({
        quote,
        coinInfo,
    });

    return useCallback(
        (step: TradingSellStep, action: TradingSellAction) => {
            analytics.report({
                type: events.tradingSellEvent.name,
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
