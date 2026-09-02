import { useEffect } from 'react';

import { type TradingExchangeIssue, events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type ExchangeIssue } from '@suite-common/trading';
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
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const issueForAnalytics = getTradingExchangeIssue(issue);

    useEffect(() => {
        if (isSimulationLoading || !issueForAnalytics) {
            return;
        }

        analytics.report({
            type: events.tradingExchangeIssueEvent.name,
            payload: {
                issue: issueForAnalytics,
                isSimulation,
            },
        });
    }, [analytics, isSimulation, isSimulationLoading, issueForAnalytics]);
};
