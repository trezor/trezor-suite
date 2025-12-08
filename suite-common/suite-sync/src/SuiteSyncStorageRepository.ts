import { SuiteSyncStorage } from '@suite-common/suite-sync-storage';
import {
    CreateSuiteSyncStorageRepositoryFactoryDeps,
    SuiteSyncStorageRepository,
} from '@suite-common/suite-sync-types';
import { SuiteSyncOwner, SuiteSyncOwnerId } from '@suite-common/suite-types';

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
