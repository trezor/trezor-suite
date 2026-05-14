import { type SuiteSyncTable } from './SuiteSyncTable';
import { type SuiteSyncSchema } from './data/SuiteSyncSchema';
import { type SuiteSyncOwner } from './owner/suiteSyncOwner';

type SuiteSyncStorageData = {
    [K in keyof SuiteSyncSchema]: SuiteSyncTable<SuiteSyncSchema[K]>;
};

/**
 * This is a **Stateful** service, that represents a Store for one Owner (for example Wallet).
 * Every wallet has its own Store. Store can use different technologies to provide Synchronization
 * of data. For example the Evolu library.
 */
export type SuiteSyncStorage = {
    data: SuiteSyncStorageData;

    updateRelayUrl(url: string): Promise<void>;
    dispose(): Promise<void>;
};

type SuiteStorageCreatorParams = {
    suiteSyncOwner: SuiteSyncOwner;
};

/**
 * This is a service responsible for creating the SuiteSyncStorage. Every Owner
 * has its own Storage. Currently only Evolu storage is implemented, but in theory,
 * you can have different one as well.
 */
export type CreateSuiteStorage = (params: SuiteStorageCreatorParams) => Promise<SuiteSyncStorage>;

export type CreateSuiteStorageDep = {
    createSuiteStorage: CreateSuiteStorage;
};
