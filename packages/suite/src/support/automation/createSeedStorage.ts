import { type SeedStorage } from '@suite/automation-tools';
import { type DeviceRootState, selectDevices, selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type AccountsRootState, selectAccounts } from '@suite-common/wallet-core';

import { type StorageLoadAction, storageLoad } from 'src/actions/suite/storageLifecycleActions';
import { type StorageLoadPayload } from 'src/storage/StorageLoadPayload';
import { createEmptyStoragePayload } from 'src/storage/createEmptyStoragePayload';

type SeedStorageState = AccountsRootState & DeviceRootState;

export type SeedStorageDeps = {
    dispatch: (action: StorageLoadAction) => void;
    getState: () => SeedStorageState;
    /** Selects a device the seed stored, matching the reducer's instance the way the app does. */
    selectDevice: (device: TrezorDevice) => Promise<unknown>;
};

/**
 * Applies a `@storage/load` after the store exists, so a consumer can seed synthetic wallet
 * state. Keys the caller leaves out take the empty database's value, so a scenario sees what it
 * implicitly relies on, and a key no store reads is reported instead of no-oping silently.
 */
export const createSeedStorage =
    (deps: SeedStorageDeps): SeedStorage =>
    async ({ storage, selectedDevice }) => {
        const defaults = createEmptyStoragePayload();
        const isStorageLoadKey = (key: string): key is keyof StorageLoadPayload =>
            Object.hasOwn(defaults, key);
        const filledKeys = Object.keys(defaults).filter(key => !Object.hasOwn(storage, key));
        const unknownKeys = Object.keys(storage).filter(key => !isStorageLoadKey(key));
        // The gated automation host supplies the slices shaped as the database rows Suite reads,
        // so the payload is trusted here like a `@storage/load` built from IndexedDB.
        const payload: StorageLoadPayload = {
            ...defaults,
            ...(storage as Partial<StorageLoadPayload>),
        };

        deps.dispatch(storageLoad(payload));

        if (selectedDevice !== undefined) {
            // Trusted the same way: the host hands over a device shaped as the device reducer
            // stores it, which no structural check on a JSON object can confirm.
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
