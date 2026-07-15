import { type SuiteSyncStorage } from '@suite-common/suite-sync-storage';

export type WithSuiteSyncStorage<TData> = {
    storage: SuiteSyncStorage;
    data: TData;
};
