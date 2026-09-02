import { useCallback } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import {
    type TradingExchangeIssue,
    events,
    selectNativeAnalyticsDep,
} from '@suite-native/analytics';

export type TradingExchangeIssueAnalyticReportCallback = (
    issue: TradingExchangeIssue,
    isSimulation: boolean,
) => void;

export const useExchangeIssueAnalyticReportCallback =
    (): TradingExchangeIssueAnalyticReportCallback => {
        const { analytics } = useServices(selectNativeAnalyticsDep);

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
