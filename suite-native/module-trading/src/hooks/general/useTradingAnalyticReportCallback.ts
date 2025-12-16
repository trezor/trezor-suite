import { TradingType } from '@suite-common/trading';
import type {
    TradingExchangeAction,
    TradingExchangeStep,
    TradingSellAction,
    TradingSellStep,
} from '@suite-native/analytics';

import { useExchangeAnalyticReportCallback } from '../exchange/useExchangeAnalyticReportCallback';
import { useSellAnalyticReportCallback } from '../sell/useSellAnalyticReportCallback';

export type TradingSellAnalyticReportCallback = (
    step: TradingSellStep,
    action: TradingSellAction,
) => void;

export type TradingExchangeAnalyticReportCallback = (
    step: TradingExchangeStep,
    action: TradingExchangeAction,
) => void;

type VoidCallback = () => void;

export type TradingAnalyticReportCallback =
    | TradingSellAnalyticReportCallback
    | TradingExchangeAnalyticReportCallback
    | VoidCallback;

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
