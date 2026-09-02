import { type TransactionEvent } from '@sentry/core';
import * as Sentry from '@sentry/react-native';

import { getSentryPerformanceEnabledOnAppStart } from './performanceConsent';

type StartupPerformanceReport = {
    startedAtMs: number;
    endedAtMs: number;
    measurements: Record<string, number>;
};

const appLoadTransactionName = 'Mobile App Load';
const startupPerformanceReportTag = 'appLoad';

let report: StartupPerformanceReport | undefined;

export const captureStartupPerformanceReport = (startupReport: StartupPerformanceReport) => {
    if (!getSentryPerformanceEnabledOnAppStart()) return;

    report = startupReport;

    const span = Sentry.startInactiveSpan({
        forceTransaction: true,
        name: appLoadTransactionName,
        op: 'mobile.app_load',
        startTime: startupReport.startedAtMs / 1000,
    });
    span.end(startupReport.endedAtMs / 1000);
};

export const sanitizeStartupPerformanceTransaction = (
    event: TransactionEvent,
): TransactionEvent | null => {
    if (event.transaction !== appLoadTransactionName || !report) return null;

    delete event.breadcrumbs;
    delete event.extra;
    delete event.request;
    delete event.spans;
    delete event.user;

    event.tags = { startupPerformanceReport: startupPerformanceReportTag };
    event.contexts = {
        app: event.contexts?.app,
        device: event.contexts?.device,
        os: event.contexts?.os,
        trace: event.contexts?.trace,
    };
    event.measurements = Object.fromEntries(
        Object.entries(report.measurements).map(([name, value]) => [
            `mobile.startup.${name}`,
            { value, unit: 'millisecond' },
        ]),
    );

    return event;
};
