import { useEffect } from 'react';

import { type ExchangeIssue } from '@suite-common/trading';
import { type TradingExchangeIssue } from '@suite-native/analytics';
import { useExchangeIssueAnalyticReportCallback } from '@suite-native/trading-analytics';
import { exhaustive } from '@trezor/type-utils';

type UseExchangeIssueAnalyticsParams = {
    issue: ExchangeIssue | null;
    isSimulationLoading: boolean;
    isSimulation: boolean;
};

export const getTradingExchangeIssue = (
    issue: ExchangeIssue | null,
): TradingExchangeIssue | undefined => {
    if (!issue) {
        return undefined;
    }

    switch (issue.type) {
        case 'price-impact':
            return `price-impact-${issue.severity}`;
        case 'high-risk':
        case 'high-risk-with-price-impact':
        case 'slippage-too-low':
            return issue.type;
        default:
            return exhaustive(issue);
    }
};

export const useExchangeIssueAnalytics = ({
    issue,
    isSimulationLoading,
    isSimulation,
}: UseExchangeIssueAnalyticsParams) => {
    const reportToAnalytics = useExchangeIssueAnalyticReportCallback();
    const issueForAnalytics = getTradingExchangeIssue(issue);

    useEffect(() => {
        if (isSimulationLoading || !issueForAnalytics) {
            return;
        }

        reportToAnalytics(issueForAnalytics, isSimulation);
    }, [isSimulation, isSimulationLoading, issueForAnalytics, reportToAnalytics]);
};
