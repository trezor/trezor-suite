/**
 * Analytics (logging user behavior in the app)
 * @docs docs/misc/analytics.md
 */

import { allowSentryReport, setSentryUser } from 'src/utils/suite/sentry';
import { getEnvironment, getCommitHash } from '@trezor/env-utils';
import type { Dispatch, GetState } from 'src/types/suite';

import {
    analyticsActions,
    selectHasUserAllowedTracking,
    selectAnalyticsInstanceId,
    selectIsAnalyticsEnabled,
    selectIsAnalyticsConfirmed,
} from '@suite-common/analytics';
import { getTrackingRandomId } from '@trezor/analytics';
import { analytics, EventType } from '@trezor/suite-analytics';

export const enableAnalyticsThunk = () => (dispatch: Dispatch) => {
    analytics.report({ type: EventType.SettingsAnalytics, payload: { value: true } });
    allowSentryReport(true);

    dispatch(analyticsActions.enableAnalytics());
};

export const disableAnalyticsThunk = () => (dispatch: Dispatch) => {
    analytics.report(
        { type: EventType.SettingsAnalytics, payload: { value: false } },
        { force: true },
    );
    allowSentryReport(false);

    dispatch(analyticsActions.disableAnalytics());
};

/**
 * Init analytics, should be always run on application start (see suiteMiddleware). It:
 * - sets common analytics variables based on what was loaded from storage
 * - set sentry user id
 * @param state - tracking state loaded from storage
 */
export const init = () => (dispatch: Dispatch, getState: GetState) => {
    const sessionId = getTrackingRandomId();
    // if instanceId does not exist yet (was not loaded from storage), create a new one
    const instanceId = selectAnalyticsInstanceId(getState()) ?? getTrackingRandomId();
    const userAllowedTracking = selectHasUserAllowedTracking(getState());
    const isAnalyticsEnabled = selectIsAnalyticsEnabled(getState());
    const isAnalyticsConfirmed = selectIsAnalyticsConfirmed(getState());

    analytics.init(userAllowedTracking, {
        instanceId,
        sessionId,
        environment: getEnvironment(),
        commitId: getCommitHash(),
        isDev: !process.env.CODESIGN_BUILD,
        callbacks: {
            onEnable: () => dispatch(enableAnalyticsThunk()),
            onDisable: () => dispatch(disableAnalyticsThunk()),
        },
    });

    allowSentryReport(!!userAllowedTracking);
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
