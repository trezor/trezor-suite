import * as Sentry from '@sentry/core';

import { selectAnalyticsInstanceId } from '@suite-common/analytics-redux';
import { redactDevice, selectRedactedActionsLog } from '@suite-common/logger';
import { allowReportTag } from '@suite-common/sentry';
import { ReportSecurityCheckParams } from '@suite-common/suite-types';
import {
    selectDiscoveryForSelectedDevice,
    selectEnabledNetworks,
    selectSelectedDevice,
} from '@suite-common/wallet-core';

import { Dispatch, GetState } from 'src/types/suite';

export const setSentryContext = Sentry.setContext;

export const setSentryTag = Sentry.setTag;

export const addSentryBreadcrumb = Sentry.addBreadcrumb;

export const withSentryScope = Sentry.withScope;

export const captureSentryMessage = Sentry.captureMessage;

export const allowSentryReport = (value: boolean) => {
    Sentry.setTag(allowReportTag, value);
};

export const setSentryUser = (instanceId: string) => {
    Sentry.setUser({ id: instanceId });
};

export const reportToSentry = (error: any) => (_: Dispatch, getState: GetState) => {
    const instanceId = selectAnalyticsInstanceId(getState());
    const enabledNetworks = selectEnabledNetworks(getState());
    const device = selectSelectedDevice(getState());
    const discovery = selectDiscoveryForSelectedDevice(getState());
    const redactedActionsLog = selectRedactedActionsLog(getState(), true);

    Sentry.withScope(scope => {
        scope.setUser({ id: instanceId });
        scope.setContext('suiteState', {
            device: redactDevice(device) ?? null,
            discovery,
            enabledCoins: enabledNetworks,
            suiteLog: redactedActionsLog?.slice(-30), // send only the last 30 actions to avoid "413 Request Entity Too Large" response from Sentry
        });
        Sentry.captureException(error);
    });
};

export const reportSecurityCheck = ({
    level,
    checkType,
    contextData,
    payload,
}: ReportSecurityCheckParams) => {
    const levelDescription = level === 'error' ? 'failed' : 'warning';
    const payloadLabel = `${checkType} check ${levelDescription}!`;
    console.warn(payloadLabel, contextData, payload);

    withSentryScope(scope => {
        scope.setLevel(level);
        scope.setTag('deviceAuthenticityError', `firmware ${checkType} check ${levelDescription}`);
        scope.setExtra(`${level}Payload`, payload);
        captureSentryMessage(`${payloadLabel} ${JSON.stringify(contextData)}`, scope);
    });
};
