import { createAction } from '@reduxjs/toolkit';

import { type WalletDescriptor } from '@suite-common/wallet-types';

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

export const quotaManagerDeviceFetched = createAction(
    `${QUOTA_MANAGER_PREFIX}/deviceFetched`,
    (payload: { deviceId: string; totalStorageSize: number; unspentStorageSize: number }) => ({
        payload,
    }),
);

/**
 * When we call for transferStorageThunk with deviceId, we want to update device quota info
 * after successful storage transfer.
 */
export const quotaManagerDeviceUnspentStorageFetched = createAction(
    `${QUOTA_MANAGER_PREFIX}/deviceQuotaUpdate`,
    (payload: { deviceId: string; unspentStorageSize: number }) => ({
        payload,
    }),
);

export const eraseFetchedData = createAction(`${QUOTA_MANAGER_PREFIX}/eraseFetchedData`);

export const quotaManagerOwnerFetched = createAction(
    `${QUOTA_MANAGER_PREFIX}/ownerFetched`,
    (payload: { walletDescriptor: WalletDescriptor; totalSpace: number }) => ({
        payload,
    }),
);

export const noQuotaLeftWarningDismissed = createAction(
    `${QUOTA_MANAGER_PREFIX}/noQuotaLeftWarningDismissed`,
    (payload: { deviceId: string }) => ({
        payload,
    }),
);

export const enforceQuotaManagerUpdated = createAction(
    `${QUOTA_MANAGER_PREFIX}/enforceQuotaManagerUpdated`,
    (payload: { enforce: boolean }) => ({ payload }),
);

export const suiteSyncQuotaManagerActions = {
    updateQuotaManagerBaseUrl,
    quotaManagerFetchError,
    quotaManagerDeviceFetched,
    quotaManagerOwnerFetched,
    eraseFetchedData,
    noQuotaLeftWarningDismissed,
    enforceQuotaManagerUpdated,
};
