import { deviceActions } from '@suite-common/device';
import { asEncryptedHex } from '@suite-common/platform-encryption';
import { type SuiteSyncOwnerSerialized } from '@suite-common/suite-sync-storage';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type StaticSessionId } from '@trezor/connect';

import { asStorageId } from './storage/createSuiteSyncStorageRepository';
import {
    initialSuiteSyncState,
    removeSuiteSyncStorageSyncStatus,
    setSuiteSyncStorageSyncStatus,
    suiteSyncReducer,
} from './suiteSyncSlice';

const DEVICE_STATIC_SESSION_ID_123: StaticSessionId = '1@2:3';
const STORAGE_ID = asStorageId('walletDescriptor');

describe(suiteSyncReducer.name, () => {
    it('removes device-specific suite sync data on forgetDevice', () => {
        const nextState = suiteSyncReducer(
            {
                ...initialSuiteSyncState,
                suiteSyncOwners: {
                    [DEVICE_STATIC_SESSION_ID_123]:
                        asEncryptedHex<SuiteSyncOwnerSerialized>('owner-key'),
                },
                suiteSyncErrors: {},
            },
            deviceActions.forgetDevice({
                device: mockSuiteDevice({
                    state: { staticSessionId: DEVICE_STATIC_SESSION_ID_123 },
                }),
            }),
        );

        expect(nextState.suiteSyncOwners[DEVICE_STATIC_SESSION_ID_123]).toBeUndefined();
        expect(nextState.suiteSyncErrors[DEVICE_STATIC_SESSION_ID_123]).toBeUndefined();
    });

    it('keeps the sync status of each storage until it is removed', () => {
        const syncedState = suiteSyncReducer(
            initialSuiteSyncState,
            setSuiteSyncStorageSyncStatus({
                storageId: STORAGE_ID,
                status: { state: 'synced', syncedAt: 1, errorType: null },
            }),
        );

        const removedState = suiteSyncReducer(
            syncedState,
            removeSuiteSyncStorageSyncStatus({ storageId: STORAGE_ID }),
        );

        expect(syncedState.storageSyncStatuses).toEqual({
            [STORAGE_ID]: { state: 'synced', syncedAt: 1, errorType: null },
        });
        expect(removedState.storageSyncStatuses).toEqual({});
    });
});
