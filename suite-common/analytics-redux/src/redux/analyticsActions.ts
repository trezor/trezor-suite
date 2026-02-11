import { createAction } from '@reduxjs/toolkit';

export const ACTION_PREFIX = '@suite-common/analytics-redux';

const initAnalytics = createAction(
    `${ACTION_PREFIX}/initAnalytics`,
    (payload: { enabled: boolean; confirmed: boolean; instanceId: string; sessionId: string }) => ({
        payload,
    }),
);

const enableAnalytics = createAction(`${ACTION_PREFIX}/enableAnalytics`);

export const disableAnalytics = createAction(`${ACTION_PREFIX}/disableAnalytics`);

const setCustomAnalyticsUrl = createAction(
    `${ACTION_PREFIX}/setCustomAnalyticsUrl`,
    (payload: string | undefined) => ({ payload }),
);

const setLoggerEnabled = createAction(
    `${ACTION_PREFIX}/setLoggerEnabled`,
    (payload: boolean | undefined) => ({ payload }),
);

export const analyticsActions = {
    initAnalytics,
    enableAnalytics,
    disableAnalytics,
    setCustomAnalyticsUrl,
    setLoggerEnabled,
} as const;
