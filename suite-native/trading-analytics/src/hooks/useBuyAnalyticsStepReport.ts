import { useCallback } from 'react';

import type { TradingBuyAction, TradingBuyStep } from '@suite-native/analytics';

import { useBuyAnalyticReportCallback } from './useBuyAnalyticReportCallback';

export const useBuyAnalyticsStepReport = (step: TradingBuyStep) => {
    const reportToAnalytics = useBuyAnalyticReportCallback();

    return useCallback(
        (action: TradingBuyAction) => reportToAnalytics(step, action),
        [reportToAnalytics, step],
    );
};
