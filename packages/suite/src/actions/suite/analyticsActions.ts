/**
 * Analytics (logging user behavior in the app)
 * @docs docs/misc/analytics.md
 */

import { EventType, getTypedDesktopLegacyAnalytics } from '@suite/analytics';
import {
    analyticsActions,
    selectAnalyticsInstanceId,
    selectHasUserAllowedTracking,
    selectIsAnalyticsConfirmed,
    selectIsAnalyticsEnabled,
} from '@suite-common/analytics';
import { ExtraDependencies } from '@suite-common/redux-utils';
import { type InitOptions, getTrackingRandomId } from '@trezor/analytics';
import { getCommitHash, getEnvironment, isCodesignBuild } from '@trezor/env-utils';

import type { Dispatch, GetState } from 'src/types/suite';
import { allowSentryReport, setSentryUser } from 'src/utils/suite/sentry';

export const enableAnalyticsThunk =
    () => (dispatch: Dispatch, _getState: GetState, extra: ExtraDependencies) => {
        getTypedDesktopLegacyAnalytics(extra.services.legacyAnalytics).report({
            type: EventType.SettingsAnalytics,
            payload: { value: true },
        });
        allowSentryReport(true);

        dispatch(analyticsActions.enableAnalytics());
    };

export const disableAnalyticsThunk =
    () => (dispatch: Dispatch, _getState: GetState, extra: ExtraDependencies) => {
        getTypedDesktopLegacyAnalytics(extra.services.legacyAnalytics).report(
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
export const init = () => (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
    const sessionId = getTrackingRandomId();
    // if instanceId does not exist yet (was not loaded from storage), create a new one
    const instanceId = selectAnalyticsInstanceId(getState()) ?? getTrackingRandomId();
    const hasUserAllowedTracking = selectHasUserAllowedTracking(getState());
    const isAnalyticsEnabled = selectIsAnalyticsEnabled(getState());
    const isAnalyticsConfirmed = selectIsAnalyticsConfirmed(getState());
    const options: InitOptions = {
        instanceId,
        sessionId,
        environment: getEnvironment(),
        commitId: getCommitHash(),
        isDev: !isCodesignBuild(),
        callbacks: {
            onEnable: () => dispatch(enableAnalyticsThunk()),
            onDisable: () => dispatch(disableAnalyticsThunk()),
        },
    };

    extra.services.legacyAnalytics.init(hasUserAllowedTracking, options);
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
};
