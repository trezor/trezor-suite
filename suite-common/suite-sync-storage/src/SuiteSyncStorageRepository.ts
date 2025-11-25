import { SuiteSyncOwner, SuiteSyncOwnerId } from '@suite-common/suite-types';

import { SuiteSyncStorage } from './SuiteSyncStorage';

type SuiteStorageCreatorParams = {
    suiteSyncOwner: SuiteSyncOwner;
    relayUrl: string;
};

/**
 * This is a service responsible for creating the SuiteSyncStorage. Every Owner
 * has its own Storage. Currently only Evolu storage is implemented, but in theory,
 * you can have different one as well.
 */
export type CreateSuiteStorage = (params: SuiteStorageCreatorParams) => SuiteSyncStorage;

export type CreateSuiteStorageDep = {
    createSuiteStorage: CreateSuiteStorage;
};

export type CreateSuiteSyncStorageRepositoryFactoryDeps = CreateSuiteStorageDep & {
    defaultRelayUrl: string;
};

export type SuiteSyncStorageRepository = {
    get: (owner: SuiteSyncOwner) => SuiteSyncStorage;
    delete: (ownerId: SuiteSyncOwnerId) => Promise<void>;
};

type CreateSuiteSyncStorageRepositoryParams = {
    relayUrl: string | null;
};

export type CreateSuiteSyncStorageRepository = ({
    relayUrl,
}: CreateSuiteSyncStorageRepositoryParams) => SuiteSyncStorageRepository;

/**
 * Every Wallet has its own SuiteSyncStorage with Owner derived
 * from its secret (Seed+Passphrase) .
 */
export const createSuiteSyncStorageRepositoryFactory =
    (deps: CreateSuiteSyncStorageRepositoryFactoryDeps): CreateSuiteSyncStorageRepository =>
    ({ relayUrl }): SuiteSyncStorageRepository => {
        const storages = new Map<SuiteSyncOwnerId, SuiteSyncStorage>();

        return {
            get: (suiteSyncOwner: SuiteSyncOwner): SuiteSyncStorage => {
                let storage = storages.get(suiteSyncOwner.ownerId);

                if (storage === undefined) {
                    storage = deps.createSuiteStorage({
                        suiteSyncOwner,
                        relayUrl: relayUrl ?? deps.defaultRelayUrl,
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
