import { type SuiteSyncStorageSyncStatus } from '@suite-common/suite-sync-storage';
import { type StaticSessionId } from '@trezor/connect';

import { asStorageId } from './createSuiteSyncStorageRepository';
import {
    selectIsSuiteSyncSynced,
    selectSuiteSyncLastSyncedAt,
    selectSuiteSyncStorageSyncStatus,
} from './storageSyncStatusSelectors';
import { type WithSuiteSyncState, initialSuiteSyncState } from '../suiteSyncSlice';

const synced: SuiteSyncStorageSyncStatus = { state: 'synced', syncedAt: 20, errorType: null };
const offline: SuiteSyncStorageSyncStatus = { state: 'offline', syncedAt: 10, errorType: null };
const initial: SuiteSyncStorageSyncStatus = { state: 'initial', syncedAt: null, errorType: null };

const createState = (
    storageSyncStatuses: Record<string, SuiteSyncStorageSyncStatus>,
): WithSuiteSyncState => ({
    suiteSync: {
        ...initialSuiteSyncState,
        storageSyncStatuses: Object.fromEntries(
            Object.entries(storageSyncStatuses).map(([storageId, status]) => [
                asStorageId(storageId),
                status,
            ]),
        ),
    },
});

describe(selectIsSuiteSyncSynced.name, () => {
    it('is synced when every storage is synced', () => {
        expect(selectIsSuiteSyncSynced(createState({ a: synced, b: synced }))).toBe(true);
    });

    it('is not synced when any storage is not synced', () => {
        expect(selectIsSuiteSyncSynced(createState({ a: synced, b: offline }))).toBe(false);
    });

    it('is not synced without any storage', () => {
        expect(selectIsSuiteSyncSynced(createState({}))).toBe(false);
    });
});

describe(selectSuiteSyncLastSyncedAt.name, () => {
    it('selects the oldest synced time', () => {
        expect(selectSuiteSyncLastSyncedAt(createState({ a: synced, b: offline }))).toBe(10);
    });

    it('is null when any storage has never synced', () => {
        expect(selectSuiteSyncLastSyncedAt(createState({ a: synced, b: initial }))).toBeNull();
    });

    it('is null without any storage', () => {
        expect(selectSuiteSyncLastSyncedAt(createState({}))).toBeNull();
    });
});

describe(selectSuiteSyncStorageSyncStatus.name, () => {
    it('selects the status of the wallet storage', () => {
        const deviceStaticSessionId: StaticSessionId = 'walletDescriptor@deviceId:0';

        expect(
            selectSuiteSyncStorageSyncStatus(
                createState({ walletDescriptor: offline }),
                deviceStaticSessionId,
            ),
        ).toEqual(offline);
        expect(selectSuiteSyncStorageSyncStatus(createState({}), deviceStaticSessionId)).toBeNull();
    });
});
