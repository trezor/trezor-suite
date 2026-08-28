/**
 * Analytics (logging user behavior in the app)
 * @docs docs/misc/analytics.md
 */

import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
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
import { type WithServices } from '@suite-common/redux-utils';
import { type InitOptions, getTrackingRandomId } from '@trezor/analytics-uploader';
import { getCommitHash, getEnvironment, isCodesignBuild } from '@trezor/env-utils';

import { allowSentryReport, setSentryUser } from 'src/utils/suite/sentry';

type SendReportProps = {
    sendReport: boolean;
};

type EnableAnalyticsThunkDeps = WithServices<DesktopAnalyticsDep>;

export const enableAnalyticsThunk =
    ({ sendReport }: SendReportProps) =>
    (
        dispatch: Dispatch<UnknownAction>,
        _getState: () => unknown,
        extra: EnableAnalyticsThunkDeps,
    ) => {
        if (sendReport) {
            extra.services.analytics.report({
                type: events.settingsAnalyticsEvent.name,
                payload: { value: true },
            });
        }
        allowSentryReport(true);

        dispatch(analyticsActions.enableAnalytics());
    };

type DisableAnalyticsThunkDeps = WithServices<DesktopAnalyticsDep>;

export const disableAnalyticsThunk =
    ({ sendReport }: SendReportProps) =>
    (
        dispatch: Dispatch<UnknownAction>,
        _getState: () => unknown,
        extra: DisableAnalyticsThunkDeps,
    ) => {
        if (sendReport) {
            extra.services.analytics.report(
                { type: events.settingsAnalyticsEvent.name, payload: { value: false } },
                { force: true },
            );
        }
        allowSentryReport(false);

        dispatch(analyticsActions.disableAnalytics());
    };

type InitAnalyticsThunkState = AnalyticsRootState;
type InitAnalyticsThunkDeps = WithServices<DesktopAnalyticsDep>;

/**
 * Init analytics, should be always run on application start (see suiteMiddleware). It:
 * - sets common analytics variables based on what was loaded from storage
 * - set sentry user id
 * @param state - tracking state loaded from storage
 */
export const init =
    () =>
    (
        dispatch: ThunkDispatch<InitAnalyticsThunkState, InitAnalyticsThunkDeps, UnknownAction>,
        getState: () => InitAnalyticsThunkState,
        extra: InitAnalyticsThunkDeps,
    ) => {
        const sessionId = getTrackingRandomId();
        // if instanceId does not exist yet (was not loaded from storage), create a new one
        const instanceId = selectAnalyticsInstanceId(getState()) ?? getTrackingRandomId();
        const hasUserAllowedTracking = selectHasUserAllowedTracking(getState());
        const isAnalyticsEnabled = selectIsAnalyticsEnabled(getState());
        const isAnalyticsConfirmed = selectIsAnalyticsConfirmed(getState());
        const customAnalyticsUrl = selectCustomAnalyticsUrl(getState());
        const loggerEnabled = selectLoggerEnabled(getState());
        const getOptions: (props: SendReportProps) => InitOptions = ({
            sendReport,
        }: SendReportProps) => ({
            instanceId,
            sessionId,
            environment: getEnvironment(),
            url: customAnalyticsUrl,
            loggerEnabled,
            commitId: getCommitHash(),
            isDev: !isCodesignBuild(),
            callbacks: {
                onEnable: () => dispatch(enableAnalyticsThunk({ sendReport })),
                onDisable: () => dispatch(disableAnalyticsThunk({ sendReport })),
            },
        });

        extra.services.analytics.init(hasUserAllowedTracking, getOptions({ sendReport: true }));

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
    };
