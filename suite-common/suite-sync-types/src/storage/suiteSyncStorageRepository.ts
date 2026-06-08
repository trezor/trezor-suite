import {
    type SuiteSyncDeleteLocalDataError,
    type SuiteSyncStorage,
} from '@suite-common/suite-sync-storage';
import { type Branded, type Result } from '@trezor/type-utils';

export type StorageId = string & Branded<'StorageId'>;

export type SuiteSyncStorageRepository = {
    get: (storageId: StorageId) => SuiteSyncStorage | null;
    delete: (storageId: StorageId) => Promise<void>;
    deleteLocalData: () => Promise<Result<void, SuiteSyncDeleteLocalDataError>>;
    set: (storageId: StorageId, storage: SuiteSyncStorage) => void;
};

export type CreateSuiteSyncStorageRepository = () => SuiteSyncStorageRepository;

export type SuiteSyncStorageRepositoryDep = {
    suiteSyncStorageRepository: SuiteSyncStorageRepository;
};
