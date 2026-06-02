import { createAction } from '@reduxjs/toolkit';

import { type WalletDescriptor } from '@suite-common/wallet';

export const QUOTA_MANAGER_PREFIX = '@suite/quota-manager';

export const updateQuotaManagerBaseUrl = createAction(
    `${QUOTA_MANAGER_PREFIX}/setBaseUrl`,
    (payload: { baseUrl: string }) => ({ payload }),
);

export const quotaManagerDeviceFetched = createAction(
    `${QUOTA_MANAGER_PREFIX}/deviceFetched`,
    (payload: { deviceId: string; totalStorageSize: number; unspentStorageSize: number }) => ({
        payload,
    }),
);

/**
 * When storage is transferred for a device, update the device quota info afterwards.
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
    quotaManagerDeviceFetched,
    quotaManagerOwnerFetched,
    eraseFetchedData,
    noQuotaLeftWarningDismissed,
    enforceQuotaManagerUpdated,
};
