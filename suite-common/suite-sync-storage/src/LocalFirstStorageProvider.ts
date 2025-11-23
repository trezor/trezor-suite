import { SuiteSyncOwner, SuiteSyncOwnerId } from '@suite-common/suite-types';

import { SuiteSyncStorage } from './SuiteSyncStorage';

type SuiteStorageCreatorParams = {
    owner: SuiteSyncOwner;
    relayUrl: string | null;
};

/**
 * This is a service responsible for creating the SuiteSyncStorage. Every Owner
 * has its own Storage. Currently only Evolu storage is implemented, but in theory,
 * you can have different one as well.
 */
export type SuiteStorageCreator = (params: SuiteStorageCreatorParams) => SuiteSyncStorage;

export class LocalFirstStorageProvider {
    private storages = new Map<SuiteSyncOwnerId, SuiteSyncStorage>();

    constructor(
        private relayUrl: string | null, // null -> fallback to default
        private storageCreator: SuiteStorageCreator,
    ) {}

    getStorage(owner: SuiteSyncOwner): SuiteSyncStorage {
        let storage = this.storages.get(owner.ownerId);

        if (storage === undefined) {
            storage = this.storageCreator({ owner, relayUrl: this.relayUrl });
            this.storages.set(owner.ownerId, storage);
        }

        return storage;
    }

    async deleteStorage(ownerId: SuiteSyncOwnerId) {
        await this.storages.get(ownerId)?.dispose();
        this.storages.delete(ownerId);
    }
}
