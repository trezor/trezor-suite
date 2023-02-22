import { createAction } from '@reduxjs/toolkit';

export const ACTION_PREFIX = '@suite-common/analytics';

const initAnalytics = createAction(
    `${ACTION_PREFIX}/initAnalytics`,
    (payload: { enabled: boolean; confirmed: boolean; instanceId: string; sessionId: string }) => ({
        payload,
    }),
);

const enableAnalytics = createAction(`${ACTION_PREFIX}/enableAnalytics`);

export const disableAnalytics = createAction(`${ACTION_PREFIX}/disableAnalytics`);

export const analyticsActions = {
    initAnalytics,
    enableAnalytics,
    disableAnalytics,
} as const;
