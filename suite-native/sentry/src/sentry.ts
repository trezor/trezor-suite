import { Options, captureConsoleIntegration } from '@sentry/core';
import * as Sentry from '@sentry/react-native';

import { allowReportTag } from '@suite-common/sentry';
import { getEnv, isDebugEnv, isDetoxTestBuild } from '@suite-native/config';

export const setSentryContext = Sentry.setContext;

export const setSentryTag = Sentry.setTag;

export const addSentryBreadcrumb = Sentry.addBreadcrumb;

export const withSentryScope = Sentry.withScope;

export const captureSentryException = Sentry.captureException;

export const captureSentryMessage = Sentry.captureMessage;

export const allowSentryReport = (value: boolean) => {
    Sentry.setTag(allowReportTag, value);
};

export const setSentryUser = (instanceId: string) => {
    Sentry.setUser({ id: instanceId });
};

const beforeSend: Options['beforeSend'] = event => {
    // sentry events are skipped until user confirm analytics reporting
    const allowReport = event.tags?.[allowReportTag];

    if (allowReport === false) {
        return null;
    }
    // allow report redacted error before confirm status is loaded
    if (typeof allowReport === 'undefined') {
        delete event.breadcrumbs;
        delete event.contexts?.device;
    }

    return event;
};

export const initSentry = () => {
    Sentry.init({
        dsn: 'https://d473f56df60c4974ae3f3ce00547c2a9@o117836.ingest.sentry.io/4504214699245568',
        enableAutoSessionTracking: false,
        environment: isDetoxTestBuild() ? 'test' : getEnv(),
        integrations: [
            captureConsoleIntegration({
                levels: ['error'],
            }),
        ],
        beforeSend,

        // You can put EXPO_PUBLIC_IS_SENTRY_ON_DEBUG_BUILD_ENABLED=true to `.env.development.local` to debug Sentry locally.
        enabled:
            !isDebugEnv() || process.env.EXPO_PUBLIC_IS_SENTRY_ON_DEBUG_BUILD_ENABLED === 'true',
    });
};
