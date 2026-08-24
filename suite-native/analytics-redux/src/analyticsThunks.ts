import {
    type AnalyticsRootState,
    analyticsActions,
    selectAnalyticsInstanceId,
    selectCustomAnalyticsUrl,
    selectHasUserAllowedTracking,
    selectIsAnalyticsConfirmed,
    selectIsAnalyticsEnabled,
    selectLoggerEnabled,
} from '@suite-common/analytics-redux';
import { createThunk } from '@suite-common/redux-utils';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { isProduction } from '@suite-native/config';
import { allowSentryReport, setSentryUser } from '@suite-native/sentry';
import { type InitOptions, getTrackingRandomId } from '@trezor/analytics-uploader';
import { getCommitHash } from '@trezor/env-utils';

const ACTION_PREFIX = '@suite-native/analytics';

type EnableAnalyticsThunkDeps = { services: NativeAnalyticsDep };

const enableAnalyticsThunk = createThunk<
    void,
    void,
    { state: void; extra: EnableAnalyticsThunkDeps }
>(`${ACTION_PREFIX}/enableAnalyticsThunk`, (_, { dispatch, extra }) => {
    extra.services.analytics.report({
        type: events.settingsDataPermissionEvent.name,
        payload: { analyticsPermission: true },
    });
    allowSentryReport(true);
    dispatch(analyticsActions.enableAnalytics());
});

type DisableAnalyticsThunkDeps = { services: NativeAnalyticsDep };

const disableAnalyticsThunk = createThunk<
    void,
    void,
    { state: void; extra: DisableAnalyticsThunkDeps }
>(`${ACTION_PREFIX}/disableAnalyticsThunk`, (_, { dispatch, extra }) => {
    extra.services.analytics.report(
        {
            type: events.settingsDataPermissionEvent.name,
            payload: { analyticsPermission: false },
        },
        { force: true },
    );
    allowSentryReport(false);
    dispatch(analyticsActions.disableAnalytics());
});

export type InitAnalyticsThunkState = AnalyticsRootState;
export type InitAnalyticsThunkDeps = { services: NativeAnalyticsDep };

export const initAnalyticsThunk = createThunk<
    void,
    void,
    { state: InitAnalyticsThunkState; extra: InitAnalyticsThunkDeps }
>(`${ACTION_PREFIX}/init`, (_, { dispatch, getState, extra }) => {
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
        isDev: !isProduction(),
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
});
