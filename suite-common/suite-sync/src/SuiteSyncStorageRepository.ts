import { CreateSuiteStorageDep, SuiteSyncStorage } from '@suite-common/suite-sync-storage';
import { SuiteSyncOwner, SuiteSyncOwnerId } from '@suite-common/suite-types';

export type CreateSuiteSyncStorageRepositoryFactoryDeps = CreateSuiteStorageDep & {
    defaultRelayUrl: string;
    getRelayUrl: () => string | null;
};

export type SuiteSyncStorageRepository = {
    get: (owner: SuiteSyncOwner) => SuiteSyncStorage;
    delete: (ownerId: SuiteSyncOwnerId) => Promise<void>;
};

export type CreateSuiteSyncStorageRepository = () => SuiteSyncStorageRepository;

export type SuiteSyncStorageRepositoryDep = {
    suiteSyncStorageRepository: SuiteSyncStorageRepository;
};

/**
 * Every Wallet has its own SuiteSyncStorage with Owner derived
 * from its secret (Seed+Passphrase) .
 */
export const createSuiteSyncStorageRepositoryFactory =
    (deps: CreateSuiteSyncStorageRepositoryFactoryDeps) => (): SuiteSyncStorageRepository => {
        const storages = new Map<SuiteSyncOwnerId, SuiteSyncStorage>();

        return {
            get: (suiteSyncOwner: SuiteSyncOwner): SuiteSyncStorage => {
                let storage = storages.get(suiteSyncOwner.ownerId);

                const relayUrl = deps.getRelayUrl();

                if (storage === undefined) {
                    storage = deps.createSuiteStorage({
                        suiteSyncOwner,
                        relayUrl:
                            relayUrl !== null && relayUrl.trim() !== ''
                                ? relayUrl
                                : deps.defaultRelayUrl,
                    });
                    storages.set(suiteSyncOwner.ownerId, storage);
                }

                return storage;
            },

            delete: async (suiteSyncOwner: SuiteSyncOwnerId) => {
                await storages.get(suiteSyncOwner)?.dispose();
                storages.delete(suiteSyncOwner);
            },
        };
    };
