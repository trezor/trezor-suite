import { type TransactionEvent } from '@sentry/core';

import { sanitizeNavigationPerformanceTransaction } from './navigationPerformance';
import { getSentryPerformanceEnabledOnAppStart } from './performanceConsent';
import { sanitizeStartupPerformanceTransaction } from './startupPerformance';

let isPerformanceReportAllowed: boolean | undefined;

export const setPerformanceReportAllowed = (isAllowed: boolean) => {
    isPerformanceReportAllowed = isAllowed;
};

export const beforeSendPerformanceTransaction = (
    event: TransactionEvent,
): TransactionEvent | null => {
    if (!getSentryPerformanceEnabledOnAppStart() || isPerformanceReportAllowed !== true) {
        return null;
    }

    return (
        sanitizeStartupPerformanceTransaction(event) ??
        sanitizeNavigationPerformanceTransaction(event)
    );
};
