import { TradingType } from '@suite-common/trading';

import {
    type TradingExchangeAnalyticReportCallback,
    useExchangeAnalyticReportCallback,
} from '../exchange/useExchangeAnalyticReportCallback';
import {
    type TradingSellAnalyticReportCallback,
    useSellAnalyticReportCallback,
} from '../sell/useSellAnalyticReportCallback';

type NullAnalyticsReportAction = (_step: unknown, _action: unknown) => void;

export type TradingAnalyticReportCallback =
    | TradingSellAnalyticReportCallback
    | TradingExchangeAnalyticReportCallback
    | NullAnalyticsReportAction;

const nullAction = () => {};

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
