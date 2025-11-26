import { CreateSuiteSyncOwner } from './Owner';
import { SuiteSyncStorageRepository } from './SuiteSyncStorageRepository';

export type SuiteSync = {
    suiteSyncStorageRepository: SuiteSyncStorageRepository;
    createSuiteSyncOwner: CreateSuiteSyncOwner;
};
