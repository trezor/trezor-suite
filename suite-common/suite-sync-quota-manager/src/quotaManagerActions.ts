import { createAction } from '@reduxjs/toolkit';

export const QUOTA_MANAGER_PREFIX = '@suite/quota-manager';

export const updateQuotaManagerBaseUrl = createAction(
    `${QUOTA_MANAGER_PREFIX}/setBaseUrl`,
    (payload: { baseUrl: string }) => ({ payload }),
);

// this action is used for displaying toasts when any fetch to the Quota Manager fails
// each platform can subscribe to this action and show appropriate error message to the user
export const quotaManagerFetchError = createAction(
    `${QUOTA_MANAGER_PREFIX}/fetchError`,
    (payload: { error: string; path?: string }) => ({ payload }),
);

export const quotaManagerEnabledUpdated = createAction(
    `${QUOTA_MANAGER_PREFIX}/setEnabled`,
    (payload: { isEnabled: boolean }) => ({ payload }),
);

export const quotaManagerDeviceFetched = createAction(
    `${QUOTA_MANAGER_PREFIX}/deviceFetched`,
    (payload: {
        deviceId: string;
        publicKey: string;
        totalStorageSize: number;
        unspentStorageSize: number;
    }) => ({
        payload,
    }),
);

export const eraseFetchedDataDebug = createAction(`${QUOTA_MANAGER_PREFIX}/eraseFetchedData`);

export const suiteSyncQuotaManagerActions = {
    updateQuotaManagerBaseUrl,
    quotaManagerFetchError,
    quotaManagerDeviceFetched,
    quotaManagerEnabledUpdated,
    eraseFetchedDataDebug,
};
