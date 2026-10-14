import { useCallback } from 'react';

import { type TradingExchangeIssue, events, injectNativeAnalytics } from '@suite-native/analytics';
import { useServices } from '@trezor/dependency-injection';

export type TradingExchangeIssueAnalyticReportCallback = (
    issue: TradingExchangeIssue,
    isSimulation: boolean,
) => void;

export const useExchangeIssueAnalyticReportCallback =
    (): TradingExchangeIssueAnalyticReportCallback => {
        const { analytics } = useServices(injectNativeAnalytics);

        return useCallback(
            (issue: TradingExchangeIssue, isSimulation: boolean) => {
                analytics.report({
                    type: events.tradingExchangeIssueEvent.name,
                    payload: {
                        issue,
                        isSimulation,
                    },
                });
            },
            [analytics],
        );
    };
