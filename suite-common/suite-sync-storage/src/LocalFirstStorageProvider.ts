import { EvoluKeys } from '@suite-common/suite-types';

import { SuiteSyncStorage } from './SuiteSyncStorage';

// Todo: Branded type, export probably
type SuiteOwnerId = string;

export type SuiteStorageCreator = (
    evoluKeys: EvoluKeys,
    relayUrl: string | null,
) => SuiteSyncStorage;

export class LocalFirstStorageProvider {
    private storages = new Map<SuiteOwnerId, SuiteSyncStorage>();

    constructor(
        private relayUrl: string | null, // null -> fallback to default
        private storageCreator: SuiteStorageCreator,
    ) {}

    getStorage(evoluKeys: EvoluKeys): SuiteSyncStorage {
        let storage = this.storages.get(evoluKeys.ownerId);

        if (storage === undefined) {
            storage = this.storageCreator(evoluKeys, this.relayUrl);
            this.storages.set(evoluKeys.ownerId, storage);
        }

        return storage;
    }

    async deleteStorage(ownerId: SuiteOwnerId) {
        await this.storages.get(ownerId)?.dispose();
        this.storages.delete(ownerId);
    }
}
