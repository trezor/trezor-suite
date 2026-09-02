import { useCallback } from 'react';

import type { TradingExchangeAction, TradingExchangeStep } from '@suite-native/analytics';

import { useExchangeAnalyticReportCallback } from './useExchangeAnalyticReportCallback';

export const useExchangeAnalyticsStepReport = (step: TradingExchangeStep) => {
    const reportToAnalytics = useExchangeAnalyticReportCallback();

    return useCallback(
        (action: TradingExchangeAction) => {
            reportToAnalytics(step, action);
        },
        [reportToAnalytics, step],
    );
};
