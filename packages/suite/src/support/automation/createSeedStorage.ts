import { type SeedStorage } from '@suite/automation-tools';
import { type DeviceRootState, selectDevices, selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type AccountsRootState, selectAccounts } from '@suite-common/wallet-core';

import { type StorageLoadAction, storageLoad } from '#src/actions/suite/storageLifecycleActions';
import { type StorageLoadPayload } from '#src/storage/StorageLoadPayload';
import { createEmptyStoragePayload } from '#src/storage/createEmptyStoragePayload';

type SeedStorageState = AccountsRootState & DeviceRootState;

export type SeedStorageDeps = {
    dispatch: (action: StorageLoadAction) => void;
    getState: () => SeedStorageState;
    /**
     * Selects a seeded device the way the app does.
     */
    selectDevice: (device: TrezorDevice) => Promise<unknown>;
};

/**
 * Seeds the store through `@storage/load`.
 * Keys left out get the empty database value; keys no store reads are reported.
 * Expects a fresh profile: some reducers merge into existing state, and the selected device is kept.
 */
export const createSeedStorage =
    (deps: SeedStorageDeps): SeedStorage =>
    async ({ storage, selectedDevice }) => {
        const defaults = createEmptyStoragePayload();
        const isStorageLoadKey = (key: string): key is keyof StorageLoadPayload =>
            Object.hasOwn(defaults, key);
        const filledKeys = Object.keys(defaults).filter(key => !Object.hasOwn(storage, key));
        const unknownKeys = Object.keys(storage).filter(key => !isStorageLoadKey(key));
        // Trusted like a payload read from IndexedDB: only a gated automation host can send it.
        const payload: StorageLoadPayload = {
            ...defaults,
            ...(storage as Partial<StorageLoadPayload>),
        };

        deps.dispatch(storageLoad(payload));

        if (selectedDevice !== undefined) {
            // Trusted the same way: no check on plain JSON can prove a device's shape.
            await deps.selectDevice(selectedDevice as unknown as TrezorDevice);
        }

        const state = deps.getState();

        return {
            accounts: selectAccounts(state).length,
            devices: selectDevices(state)?.length ?? 0,
            selectedDevice: selectSelectedDevice(state) !== undefined,
            filledKeys,
            unknownKeys,
        };
    };
