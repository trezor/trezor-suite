import {
    analyticsActions,
    selectAnalyticsInstanceId,
    selectCustomAnalyticsUrl,
    selectHasUserAllowedTracking,
    selectIsAnalyticsConfirmed,
    selectIsAnalyticsEnabled,
    selectLoggerEnabled,
} from '@suite-common/analytics-redux';
import { createThunk } from '@suite-common/redux-utils';
import { EventType, asTypedNativeAnalytics } from '@suite-native/analytics';
import { isDevelopEnv } from '@suite-native/config';
import { allowSentryReport, setSentryUser } from '@suite-native/sentry';
import { type InitOptions, getTrackingRandomId } from '@trezor/analytics-uploader';
import { getCommitHash } from '@trezor/env-utils';

const ACTION_PREFIX = '@suite-native/analytics';

const enableAnalyticsThunk = createThunk(
    `${ACTION_PREFIX}/enableAnalyticsThunk`,
    (_, { dispatch, extra }) => {
        asTypedNativeAnalytics(extra.services.analytics).report({
            type: EventType.SettingsDataPermission,
            payload: { analyticsPermission: true },
        });
        allowSentryReport(true);
        dispatch(analyticsActions.enableAnalytics());
    },
);

const disableAnalyticsThunk = createThunk(
    `${ACTION_PREFIX}/disableAnalyticsThunk`,
    (_, { dispatch, extra }) => {
        asTypedNativeAnalytics(extra.services.analytics).report(
            { type: EventType.SettingsDataPermission, payload: { analyticsPermission: false } },
            { force: true },
        );
        allowSentryReport(false);
        dispatch(analyticsActions.disableAnalytics());
    },
);

export const initAnalyticsThunk = createThunk(
    `${ACTION_PREFIX}/init`,
    (_, { dispatch, getState, extra }) => {
        const sessionId = getTrackingRandomId();
        const instanceId = selectAnalyticsInstanceId(getState()) ?? getTrackingRandomId();
        const hasUserAllowedTracking = selectHasUserAllowedTracking(getState());

        const isAnalyticsEnabled = selectIsAnalyticsEnabled(getState());
        const isAnalyticsConfirmed = selectIsAnalyticsConfirmed(getState());

        const customAnalyticsUrl = selectCustomAnalyticsUrl(getState());
        const loggerEnabled = selectLoggerEnabled(getState());

        const options: InitOptions = {
            instanceId,
            sessionId,
            environment: 'mobile',
            url: customAnalyticsUrl,
            loggerEnabled,
            commitId: getCommitHash(),
            isDev: isDevelopEnv(),
            callbacks: {
                onEnable: () => dispatch(enableAnalyticsThunk()),
                onDisable: () => dispatch(disableAnalyticsThunk()),
            },
        };

        extra.services.analytics.init(hasUserAllowedTracking, options);

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
