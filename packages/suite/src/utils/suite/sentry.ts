import * as Sentry from '@sentry/core';

import { allowReportTag } from '@suite-common/sentry';

import { Dispatch, GetState } from 'src/types/suite';
import { redactDevice, redactDiscovery, getApplicationLog } from 'src/utils/suite/logsUtils';
import { selectDevice } from 'src/reducers/suite/deviceReducer';

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
    const { analytics, wallet, logs } = getState();
    const device = selectDevice(getState());

    Sentry.withScope(scope => {
        scope.setUser({ id: analytics.instanceId });
        scope.setContext('suiteState', {
            device: redactDevice(device) ?? null,
            discovery: wallet.discovery.map(redactDiscovery),
            enabledCoins: wallet.settings.enabledNetworks,
            suiteLog: getApplicationLog(logs.logEntries, true)?.slice(-30), // send only the last 30 actions to avoid "413 Request Entity Too Large" response from Sentry
        });
        Sentry.captureException(error);
    });
};
