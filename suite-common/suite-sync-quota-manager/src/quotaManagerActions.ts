import { createAction } from '@reduxjs/toolkit';

export const QUOTA_MANAGER_PREFIX = '@suite/quota-manager';

export const updateQuotaManagerBaseUrl = createAction(
    `${QUOTA_MANAGER_PREFIX}/setBaseUrl`,
    (payload: { baseUrl: string }) => ({ payload }),
);

export const quotaManagerSessionIdGenerated = createAction(
    `${QUOTA_MANAGER_PREFIX}/setSessionId`,
    (payload: { sessionId: string | null }) => ({ payload }),
);

export const quotaManagerChallengeFetched = createAction(
    `${QUOTA_MANAGER_PREFIX}/setChallenge`,
    (payload: { challenge: string | null }) => ({ payload }),
);

// this action is used for displaying toasts when any fetch to the Quota Manager fails
export const quotaManagerFetchError = createAction(
    `${QUOTA_MANAGER_PREFIX}/fetchError`,
    (payload: { error: string }) => ({ payload }),
);
