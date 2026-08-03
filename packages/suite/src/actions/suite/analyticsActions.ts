/**
 * Analytics (logging user behavior in the app)
 * @docs docs/misc/analytics.md
 */

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import {
    analyticsActions,
    selectAnalyticsInstanceId,
    selectCustomAnalyticsUrl,
    selectHasUserAllowedTracking,
    selectIsAnalyticsConfirmed,
    selectIsAnalyticsEnabled,
    selectLoggerEnabled,
} from '@suite-common/analytics-redux';
import { type InitOptions, getTrackingRandomId } from '@trezor/analytics-uploader';
import { getCommitHash, getEnvironment, isCodesignBuild } from '@trezor/env-utils';

import type { Dispatch, GetState } from 'src/types/suite';
import { allowSentryReport, setSentryUser } from 'src/utils/suite/sentry';

type SendReportProps = {
    sendReport: boolean;
};

type EnableAnalyticsThunkDeps = { services: DesktopAnalyticsDep };

export const enableAnalyticsThunk =
    ({ sendReport }: SendReportProps) =>
    (dispatch: Dispatch, _getState: GetState, extra: EnableAnalyticsThunkDeps) => {
        if (sendReport) {
            extra.services.analytics.report({
                type: events.settingsAnalyticsEvent.name,
                payload: { value: true },
            });
        }
        allowSentryReport(true);

        dispatch(analyticsActions.enableAnalytics());
    };

type DisableAnalyticsThunkDeps = { services: DesktopAnalyticsDep };

export const disableAnalyticsThunk =
    ({ sendReport }: SendReportProps) =>
    (dispatch: Dispatch, _getState: GetState, extra: DisableAnalyticsThunkDeps) => {
        if (sendReport) {
            extra.services.analytics.report(
                { type: events.settingsAnalyticsEvent.name, payload: { value: false } },
                { force: true },
            );
        }
        allowSentryReport(false);

        dispatch(analyticsActions.disableAnalytics());
    };

type InitDeps = { services: DesktopAnalyticsDep };

/**
 * Init analytics, should be always run on application start (see suiteMiddleware). It:
 * - sets common analytics variables based on what was loaded from storage
 * - set sentry user id
 * @param state - tracking state loaded from storage
 */
export const init = () => (dispatch: Dispatch, getState: GetState, extra: InitDeps) => {
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
