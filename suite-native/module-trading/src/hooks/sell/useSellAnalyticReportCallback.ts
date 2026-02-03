import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import type { SellFiatTrade } from 'invity-api';

import {
    TradingRootState,
    selectTradingCoinInfoByCryptoId,
    selectTradingSellSelectedQuote,
} from '@suite-common/trading';
import { EventType, TradingSellAction, TradingSellStep } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';

import { getAnalyticsTradingSellPayload } from '../../utils/sell/quotesUtils';

export type TradingSellAnalyticReportCallback = (
    step: TradingSellStep,
    action: TradingSellAction,
) => void;

export const useSellAnalyticReportCallback = (
    candidateQuote?: SellFiatTrade,
): TradingSellAnalyticReportCallback => {
    const analytics = useAnalytics();
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
                type: EventType.TradingSell,
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
