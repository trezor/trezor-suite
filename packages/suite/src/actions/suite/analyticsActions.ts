/* eslint-disable camelcase */
/**
 * Analytics (logging user behavior in the app)
 * @docs docs/misc/analytics.md
 */

import { analytics, EventType } from '@trezor/suite-analytics';

import { ANALYTICS } from '@suite-actions/constants';
import { getTrackingRandomId } from '@suite-utils/random';
import { allowSentryReport, setSentryUser } from '@suite-utils/sentry';
import { AnalyticsState } from '@suite-reducers/analyticsReducer';
import { isDev } from '@suite-utils/build';
import { getEnvironment } from '@suite-utils/env';

import type { Dispatch } from '@suite-types';

export type AnalyticsAction =
    | { type: typeof ANALYTICS.ENABLE }
    | { type: typeof ANALYTICS.DISABLE }
    | {
          type: typeof ANALYTICS.INIT;
          payload: {
              instanceId: string;
              sessionId: string;
              enabled: boolean;
              confirmed: boolean;
          };
      };

export const enable = () => (dispatch: Dispatch) => {
    analytics.report({ type: EventType.SettingsAnalytics, payload: { value: true } });
    allowSentryReport(true);

    dispatch({
        type: ANALYTICS.ENABLE,
    });
};

export const disable = () => (dispatch: Dispatch) => {
    analytics.report({ type: EventType.SettingsAnalytics, payload: { value: false } }, true);
    allowSentryReport(false);

    dispatch({
        type: ANALYTICS.DISABLE,
    });
};

/**
 * Init analytics, should be always run on application start (see suiteMiddleware). It:
 * - sets common analytics variables based on what was loaded from storage
 * - set sentry user id
 * @param state - tracking state loaded from storage
 */
export const init = (state: AnalyticsState) => (dispatch: Dispatch) => {
    // if instanceId does not exist yet (was not loaded from storage), create a new one
    const instanceId = state.instanceId || getTrackingRandomId();
    const sessionId = getTrackingRandomId();

    // if user made choice, keep it, otherwise set it to true by default just to prefill the confirmation toggle
    const isConfirmed = !!state.confirmed;
    const isEnabled = isConfirmed ? !!state.enabled : true;

    // allow tracking only if user already confirmed data collection
    const userAllowedTracking = isConfirmed && isEnabled;

    analytics.init(userAllowedTracking, {
        instanceId,
        sessionId,
        environment: getEnvironment(),
        commitId: process.env.COMMITHASH || '',
        isDev,
        callbacks: {
            onEnable: () => dispatch(enable()),
            onDisable: () => dispatch(disable()),
        },
    });

    allowSentryReport(userAllowedTracking);
    setSentryUser(instanceId);

    dispatch({
        type: ANALYTICS.INIT,
        payload: {
            instanceId,
            sessionId,
            enabled: isEnabled,
            confirmed: isConfirmed,
        },
    });
};
