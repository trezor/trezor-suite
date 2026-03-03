import { captureConsoleIntegration } from '@sentry/core';
import * as Sentry from '@sentry/react-native';

import { ALLOW_REPORT_TAG, redactSentryEvent } from '@suite-common/sentry';
import { getEnv, isDebugEnv, isDetoxTestBuild } from '@suite-native/config';

import { ignoreErrors } from './ignoreErrors';

export const setSentryContext = Sentry.setContext;

export const setSentryTag = Sentry.setTag;

export const addSentryBreadcrumb = Sentry.addBreadcrumb;

export const withSentryScope = Sentry.withScope;

export const captureSentryException = Sentry.captureException;

export const captureSentryMessage = Sentry.captureMessage;

export const allowSentryReport = (value: boolean) => {
    Sentry.setTag(ALLOW_REPORT_TAG, value);
};

export const setSentryUser = (instanceId: string) => {
    Sentry.setUser({ id: instanceId });
};

export const initSentry = () => {
    Sentry.init({
        dsn: 'https://d473f56df60c4974ae3f3ce00547c2a9@o117836.ingest.sentry.io/4504214699245568',
        enableAutoSessionTracking: false,
        environment: isDetoxTestBuild() ? 'test' : getEnv(),
        integrations: defaults => [
            // remove consoleLoggingIntegration, which sends console.errors as logs
            ...defaults.filter(i => i.name !== 'ConsoleLogs'),
            // use this instead, which sends console.errors as error events
            captureConsoleIntegration({ levels: ['error'] }),
        ],
        enableLogs: true,
        beforeSend: redactSentryEvent,
        ignoreErrors,

        // You can put EXPO_PUBLIC_IS_SENTRY_ON_DEBUG_BUILD_ENABLED=true to `.env.development.local` to debug Sentry locally.
        enabled:
            !isDebugEnv() || process.env.EXPO_PUBLIC_IS_SENTRY_ON_DEBUG_BUILD_ENABLED === 'true',
    });
};
