import {
    type DeleteSuiteSyncLocalData,
    type SuiteSyncStorageRepositoryDep,
} from '@suite-common/suite-sync-types';

export const createDeleteSuiteSyncLocalData =
    (deps: SuiteSyncStorageRepositoryDep): DeleteSuiteSyncLocalData =>
    () =>
        deps.suiteSyncStorageRepository.deleteLocalData();
