import { type SuiteSyncStorage } from '@suite-common/suite-sync-storage';
import { type StorageId, type SuiteSyncStorageRepository } from '@suite-common/suite-sync-types';
import { err, ok } from '@trezor/type-utils';

export const asStorageId = (value: string) => value as StorageId;

/**
 * Every Wallet has its own SuiteSyncStorage with Owner derived
 * from its secret (Seed+Passphrase) .
 */
export const createSuiteSyncStorageRepository = (): SuiteSyncStorageRepository => {
    const storages = new Map<StorageId, SuiteSyncStorage>();

    return {
        get: (storageId: StorageId) => storages.get(storageId) ?? null,

        delete: async (storageId: StorageId) => {
            await storages.get(storageId)?.dispose();
            storages.delete(storageId);
        },

        deleteLocalData: async () => {
            const results = await Promise.all(
                [...storages.values()].map(storage => storage.deleteLocalData()),
            );
            const failedResult = results.find(result => !result.success);

            if (failedResult) {
                return err(failedResult.error);
            }

            storages.clear();

            return ok();
        },

        set: (storageId, storage) => {
            storages.set(storageId, storage);
        },
    };
};
