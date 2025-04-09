import * as Sentry from '@sentry/react-native';

import { allowReportTag } from '@suite-common/sentry';

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
