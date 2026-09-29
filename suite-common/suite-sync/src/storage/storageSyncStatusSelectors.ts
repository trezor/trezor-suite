import { createWeakMapSelector } from '@suite-common/redux-utils';
import { type SuiteSyncStorageSyncStatus } from '@suite-common/suite-sync-storage';
import { type StaticSessionId } from '@trezor/connect';
import { isNotNull } from '@trezor/utils';

import { createStorageIdFromDeviceStaticSessionId } from './createStorageIdFromDeviceStaticSessionId';
import { type WithSuiteSyncState } from '../suiteSyncSlice';

const createMemoizedSelector = createWeakMapSelector.withTypes<WithSuiteSyncState>();

const selectSuiteSyncStorageSyncStatuses = (state: WithSuiteSyncState) =>
    state.suiteSync.storageSyncStatuses;

export const selectSuiteSyncStorageSyncStatus = (
    state: WithSuiteSyncState,
    deviceStaticSessionId: StaticSessionId,
): SuiteSyncStorageSyncStatus | null =>
    state.suiteSync.storageSyncStatuses[
        createStorageIdFromDeviceStaticSessionId(deviceStaticSessionId)
    ] ?? null;

export const selectIsSuiteSyncSynced = createMemoizedSelector(
    [selectSuiteSyncStorageSyncStatuses],
    storageSyncStatuses => {
        const statuses = Object.values(storageSyncStatuses);

        return statuses.length > 0 && statuses.every(status => status.state === 'synced');
    },
);

/**
 * The time as of which every storage was synced, or null when any storage has never synced.
 */
export const selectSuiteSyncLastSyncedAt = createMemoizedSelector(
    [selectSuiteSyncStorageSyncStatuses],
    storageSyncStatuses => {
        const statuses = Object.values(storageSyncStatuses);
        const syncedAts = statuses.map(status => status.syncedAt).filter(isNotNull);

        if (statuses.length === 0 || syncedAts.length < statuses.length) {
            return null;
        }

        return Math.min(...syncedAts);
    },
);
