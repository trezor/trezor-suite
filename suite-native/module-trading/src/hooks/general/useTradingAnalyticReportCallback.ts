import { TradingType } from '@suite-common/trading';
import type {
    TradingExchangeAction,
    TradingExchangeStep,
    TradingSellAction,
    TradingSellStep,
} from '@suite-native/analytics';

import { useExchangeAnalyticReportCallback } from '../exchange/useExchangeAnalyticReportCallback';
import { useSellAnalyticReportCallback } from '../sell/useSellAnalyticReportCallback';

export const useTradingAnalyticReportCallback = (
    tradingType?: TradingType,
):
    | ((step: TradingSellStep, action: TradingSellAction) => void)
    | ((step: TradingExchangeStep, action: TradingExchangeAction) => void) => {
    const exchangeReportToAnalytics = useExchangeAnalyticReportCallback();
    const sellReportToAnalytics = useSellAnalyticReportCallback();

    return tradingType === 'sell' ? sellReportToAnalytics : exchangeReportToAnalytics;
};
