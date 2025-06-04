import {
    analyticsActions,
    selectAnalyticsInstanceId,
    selectHasUserAllowedTracking,
    selectIsAnalyticsConfirmed,
    selectIsAnalyticsEnabled,
} from '@suite-common/analytics';
import { EventType, analytics } from '@suite-common/analytics/src/events/suite-native';
import { createThunk } from '@suite-common/redux-utils';
import { isDevelopEnv } from '@suite-native/config';
import { allowSentryReport, setSentryUser } from '@suite-native/sentry';
import { getTrackingRandomId } from '@trezor/analytics';
import { getCommitHash } from '@trezor/env-utils';

const ACTION_PREFIX = '@suite-native/analytics';

export const enableAnalyticsThunk = createThunk(
    `${ACTION_PREFIX}/enableAnalyticsThunk`,
    (_, { dispatch }) => {
        analytics.report({
            type: EventType.SettingsDataPermission,
            payload: { analyticsPermission: true },
        });
        allowSentryReport(true);
        dispatch(analyticsActions.enableAnalytics());
    },
);

export const disableAnalyticsThunk = createThunk(
    `${ACTION_PREFIX}/disableAnalyticsThunk`,
    (_, { dispatch }) => {
        analytics.report(
            { type: EventType.SettingsDataPermission, payload: { analyticsPermission: false } },
            { force: true },
        );
        allowSentryReport(false);
        dispatch(analyticsActions.disableAnalytics());
    },
);

export const initAnalyticsThunk = createThunk(
    `${ACTION_PREFIX}/init`,
    (_, { dispatch, getState }) => {
        const sessionId = getTrackingRandomId();
        const instanceId = selectAnalyticsInstanceId(getState()) ?? getTrackingRandomId();
        const hasUserAllowedTracking = selectHasUserAllowedTracking(getState());

        const isAnalyticsEnabled = selectIsAnalyticsEnabled(getState());
        const isAnalyticsConfirmed = selectIsAnalyticsConfirmed(getState());

        analytics.init(hasUserAllowedTracking, {
            instanceId,
            sessionId,
            environment: 'mobile',
            commitId: getCommitHash(),
            isDev: isDevelopEnv(),
            callbacks: {
                onEnable: () => dispatch(enableAnalyticsThunk()),
                onDisable: () => dispatch(disableAnalyticsThunk()),
            },
        });

        allowSentryReport(isAnalyticsEnabled);
        setSentryUser(instanceId);

        dispatch(
            analyticsActions.initAnalytics({
                instanceId,
                sessionId,
                enabled: isAnalyticsEnabled,
                confirmed: isAnalyticsConfirmed,
            }),
        );
    },
);
