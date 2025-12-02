import type {
    TradingExchangeAction,
    TradingExchangeStep,
    TradingSellAction,
    TradingSellStep,
} from '@suite-native/analytics';

export type TradingSellAnalyticReportCallback = (
    step: TradingSellStep,
    action: TradingSellAction,
) => void;

export type TradingExchangeAnalyticReportCallback = (
    step: TradingExchangeStep,
    action: TradingExchangeAction,
) => void;

export type VoidCallback = () => void;

export type TradingAnalyticReportCallback =
    | TradingSellAnalyticReportCallback
    | TradingExchangeAnalyticReportCallback
    | VoidCallback;
