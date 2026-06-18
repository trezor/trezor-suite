import { type SuiteSyncDeleteLocalDataError } from '@suite-common/suite-sync-storage';
import { type Result } from '@trezor/type-utils';

export type DeleteSuiteSyncLocalData = () => Promise<Result<void, SuiteSyncDeleteLocalDataError>>;

export type DeleteSuiteSyncLocalDataDep = {
    deleteSuiteSyncLocalData: DeleteSuiteSyncLocalData;
};

export const selectDeleteSuiteSyncLocalDataDep = (services: any): DeleteSuiteSyncLocalDataDep => ({
    deleteSuiteSyncLocalData: services.suiteSync.deleteSuiteSyncLocalData,
});
