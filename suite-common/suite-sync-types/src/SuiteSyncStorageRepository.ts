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
