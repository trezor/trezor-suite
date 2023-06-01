import {
    selectAnalyticsInstanceId,
    selectHasUserAllowedTracking,
    analyticsActions,
    selectIsAnalyticsEnabled,
    selectIsAnalyticsConfirmed,
} from '@suite-common/analytics';
import { createThunk } from '@suite-common/redux-utils';
import { getTrackingRandomId } from '@trezor/analytics';
import { isDevelopEnv } from '@suite-native/config';
import { getCommitHash } from '@trezor/env-utils';

import { analytics } from './analytics';
import { EventType } from './constants';

const ACTION_PREFIX = '@suite-native/analytics';

export const enableAnalyticsThunk = createThunk(
    `${ACTION_PREFIX}/enableAnalyticsThunk`,
    (_, { dispatch }) => {
        analytics.report({
            type: EventType.SettingsDataPermission,
            payload: { analyticsPermission: true },
        });
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
        dispatch(analyticsActions.disableAnalytics());
    },
);

export const initAnalyticsThunk = createThunk(
    `${ACTION_PREFIX}/init`,
    (_, { dispatch, getState }) => {
        const sessionId = getTrackingRandomId();
        const instanceId = selectAnalyticsInstanceId(getState()) ?? getTrackingRandomId();
        const userAllowedTracking = selectHasUserAllowedTracking(getState());

        const isAnalyticsEnabled = selectIsAnalyticsEnabled(getState());
        const isAnalyticsConfirmed = selectIsAnalyticsConfirmed(getState());

        analytics.init(userAllowedTracking, {
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
