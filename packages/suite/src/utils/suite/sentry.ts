import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';
import * as Sentry from '@sentry/core';

import { setAnalyticsConfirmedAndEnabled } from '@suite/sentry';
import { type AnalyticsRootState, selectAnalyticsInstanceId } from '@suite-common/analytics-redux';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import {
    type LogsSliceRootState,
    redactDevice,
    redactDiscovery,
    selectRedactedActionsLog,
} from '@suite-common/logger';
import { ALLOW_REPORT_TAG } from '@suite-common/sentry';
import { type ReportSecurityCheckParams } from '@suite-common/suite-types';
import {
    type DiscoveryRootState,
    type WalletSettingsRootState,
    selectDiscoveryForSelectedDevice,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';

export const setSentryContext = Sentry.setContext;

export const setSentryTag = Sentry.setTag;

export const addSentryBreadcrumb = Sentry.addBreadcrumb;

export const withSentryScope = Sentry.withScope;

export const captureSentryMessage = Sentry.captureMessage;

/**
 * Sets a tag to allow or disallow sending Sentry reports. Until then, they are sent, but heavily redacted, see redactSentryEvent function.
 * Note that in case of Suite Desktop, Sentry tags are shared between Renderer and Main process, sentry has its own IPC:
 * https://docs.sentry.io/platforms/javascript/guides/electron/features/inter-process-communication/,
 */
export const allowSentryReport = (value: boolean) => {
    Sentry.setTag(ALLOW_REPORT_TAG, value);
    // synchronize the newly set value to localStorage (`value` may have been also be retrieved from IDB, which effectively synces it)
    setAnalyticsConfirmedAndEnabled(value);
};

export const setSentryUser = (instanceId: string) => {
    Sentry.setUser({ id: instanceId });
};

type ReportToSentryThunkState = AnalyticsRootState &
    DeviceRootState &
    DiscoveryRootState &
    LogsSliceRootState &
    WalletSettingsRootState;

export const reportToSentryThunk =
    (error: any) => (_: Dispatch<UnknownAction>, getState: () => ReportToSentryThunkState) => {
        const instanceId = selectAnalyticsInstanceId(getState());
        const enabledNetworks = selectEnabledNetworks(getState());
        const device = selectSelectedDevice(getState());
        const discovery = selectDiscoveryForSelectedDevice(getState());
        const redactedActionsLog = selectRedactedActionsLog(getState(), true);

        Sentry.withScope(scope => {
            scope.setUser({ id: instanceId });
            scope.setContext('suiteState', {
                device: redactDevice(device) ?? null,
                discovery: redactDiscovery(discovery) ?? null,
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
