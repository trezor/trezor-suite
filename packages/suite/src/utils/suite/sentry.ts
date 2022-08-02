import * as Sentry from '@sentry/minimal';

import { Dispatch, GetState } from '@suite-types';
import { allowReportTag } from '@suite-config/sentry';
import { redactDevice, redactDiscovery, getApplicationLog } from '@suite-utils/logsUtils';

export const setSentryContext = Sentry.setContext;

export const setSentryTag = Sentry.setTag;

export const addSentryBreadcrumb = Sentry.addBreadcrumb;

export const allowSentryReport = (value: boolean) => {
    Sentry.setTag(allowReportTag, value);
};

export const setSentryUser = (instanceId: string) => {
    Sentry.setUser({ id: instanceId });
};

export const unsetSentryUser = () => {
    Sentry.setUser(null);
};

export const reportToSentry = (error: any) => (_: Dispatch, getState: GetState) => {
    const { analytics, wallet, suite, logs } = getState();

    Sentry.withScope(scope => {
        scope.setUser({ id: analytics.instanceId });
        scope.setContext('suiteState', {
            device: redactDevice(suite.device) ?? null,
            discovery: wallet.discovery.map(redactDiscovery),
            enabledCoins: wallet.settings.enabledNetworks,
            suiteLog: getApplicationLog(logs, true)?.slice(-30), // send only the last 30 actions to avoid "413 Request Entity Too Large" response from Sentry
        });
        Sentry.captureException(error);
    });
};
