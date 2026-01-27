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
} from '@suite-common/analytics-redux';
import { ExtraDependencies } from '@suite-common/redux-utils';
import { type InitOptions, getTrackingRandomId } from '@trezor/analytics';
import { getCommitHash, getEnvironment, isCodesignBuild } from '@trezor/env-utils';

import type { Dispatch, GetState } from 'src/types/suite';
import { allowSentryReport, setSentryUser } from 'src/utils/suite/sentry';

type SendReportProps = {
    sendReport: boolean;
};

export const enableAnalyticsThunk =
    ({ sendReport }: SendReportProps) =>
    (dispatch: Dispatch, _getState: GetState, extra: ExtraDependencies) => {
        if (sendReport) {
            getTypedDesktopLegacyAnalytics(extra.services.legacyAnalytics).report({
                type: EventType.SettingsAnalytics,
                payload: { value: true },
            });
        }
        allowSentryReport(true);

        dispatch(analyticsActions.enableAnalytics());
    };

export const disableAnalyticsThunk =
    ({ sendReport }: SendReportProps) =>
    (dispatch: Dispatch, _getState: GetState, extra: ExtraDependencies) => {
        if (sendReport) {
            getTypedDesktopLegacyAnalytics(extra.services.legacyAnalytics).report(
                { type: EventType.SettingsAnalytics, payload: { value: false } },
                { force: true },
            );
        }
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
    const getOptions: (props: SendReportProps) => InitOptions = ({
        sendReport,
    }: SendReportProps) => ({
        instanceId,
        sessionId,
        environment: getEnvironment(),
        commitId: getCommitHash(),
        isDev: !isCodesignBuild(),
        callbacks: {
            onEnable: () => dispatch(enableAnalyticsThunk({ sendReport })),
            onDisable: () => dispatch(disableAnalyticsThunk({ sendReport })),
        },
    });

    // `sendReport` argument is used only for not sending event `EventType.SettingsAnalytics` twice and it will not be necessary since we delete legacyAnalytics (https://github.com/trezor/trezor-suite/issues/24428)
    extra.services.legacyAnalytics.init(hasUserAllowedTracking, getOptions({ sendReport: false }));
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
