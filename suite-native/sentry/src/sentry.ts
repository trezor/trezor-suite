import { captureConsoleIntegration } from '@sentry/core';
import * as Sentry from '@sentry/react-native';

import { ALLOW_REPORT_TAG, redactSentryEvent } from '@suite-common/sentry';
import { getEnv, isDebugEnv, isDetoxTestBuild, isProduction } from '@suite-native/config';

import { ignoreErrors } from './ignoreErrors';
import { createNavigationPerformanceIntegration } from './navigationPerformance';
import { beforeSendPerformanceTransaction, setPerformanceReportAllowed } from './performance';
import {
    getPersistedSentryPerformanceConsent,
    setPersistedSentryPerformanceConsent,
    setSentryPerformanceEnabledOnAppStart,
} from './performanceConsent';

export const setSentryContext = Sentry.setContext;

export const setSentryTag = Sentry.setTag;

export const addSentryBreadcrumb = Sentry.addBreadcrumb;

export const withSentryScope = Sentry.withScope;

export const captureSentryException = Sentry.captureException;

export const captureSentryMessage = Sentry.captureMessage;

export const allowSentryReport = (value: boolean) => {
    Sentry.setTag(ALLOW_REPORT_TAG, value);
    setPerformanceReportAllowed(value);
    setPersistedSentryPerformanceConsent(value);
};

export const setSentryUser = (instanceId: string) => {
    Sentry.setUser({ id: instanceId });
};

export const initSentry = () => {
    const isPerformanceEnabledOnAppStart = getPersistedSentryPerformanceConsent();
    let performanceTracesSampleRate = 0;

    if (isPerformanceEnabledOnAppStart) {
        performanceTracesSampleRate = isProduction() ? 0.1 : 1;
    }

    setSentryPerformanceEnabledOnAppStart(isPerformanceEnabledOnAppStart);

    Sentry.init({
        dsn: 'https://d473f56df60c4974ae3f3ce00547c2a9@o117836.ingest.sentry.io/4504214699245568',
        enableAutoSessionTracking: false,
        environment: isDetoxTestBuild() ? 'test' : getEnv(),
        // Important: must be a function to keep default Sentry integrations; an array would mean ONLY those specific integrations.
        integrations: defaults => [
            // Remove consoleLoggingIntegration, which sends console.errors as logs, and
            // AppStart, which is reported through a manually bounded transaction.
            ...defaults.filter(i => i.name !== 'ConsoleLogs' && i.name !== 'AppStart'),
            ...(isPerformanceEnabledOnAppStart ? [createNavigationPerformanceIntegration()] : []),
            // Use this instead, which sends console.errors as error events.
            captureConsoleIntegration({ levels: ['error'] }),
        ],
        tracesSampleRate: performanceTracesSampleRate,
        // Keep auto performance tracing enabled for navigation TTID/native frame/stall measurements;
        // beforeSendTransaction allowlists which performance transactions may leave the app.
        enableAutoPerformanceTracing: isPerformanceEnabledOnAppStart,
        enableNativeFramesTracking: isPerformanceEnabledOnAppStart,
        enableStallTracking: isPerformanceEnabledOnAppStart,
        enableUserInteractionTracing: false,
        enableLogs: true,
        beforeSend: redactSentryEvent,
        beforeSendTransaction: beforeSendPerformanceTransaction,
        ignoreErrors,

        // You can put EXPO_PUBLIC_IS_SENTRY_ON_DEBUG_BUILD_ENABLED=true to `.env.development.local` to debug Sentry locally.
        enabled:
            !isDebugEnv() || process.env.EXPO_PUBLIC_IS_SENTRY_ON_DEBUG_BUILD_ENABLED === 'true',
    });
};
