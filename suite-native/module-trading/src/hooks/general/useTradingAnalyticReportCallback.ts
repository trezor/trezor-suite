import { TradingType } from '@suite-common/trading';

import type {
    TradingAnalyticReportCallback,
    VoidCallback,
} from './tradingAnalyticReportCallbackTypes';
import { useExchangeAnalyticReportCallback } from '../exchange/useExchangeAnalyticReportCallback';
import { useSellAnalyticReportCallback } from '../sell/useSellAnalyticReportCallback';

export type {
    TradingAnalyticReportCallback,
    TradingExchangeAnalyticReportCallback,
    TradingSellAnalyticReportCallback,
} from './tradingAnalyticReportCallbackTypes';

const nullAction: VoidCallback = () => {};

export const useTradingAnalyticReportCallback = (
    tradingType?: TradingType,
): TradingAnalyticReportCallback => {
    const exchangeReportToAnalytics = useExchangeAnalyticReportCallback();
    const sellReportToAnalytics = useSellAnalyticReportCallback();

    switch (tradingType) {
        case 'exchange':
            return exchangeReportToAnalytics;
        case 'sell':
            return sellReportToAnalytics;
        default:
            return nullAction;
    }
};
