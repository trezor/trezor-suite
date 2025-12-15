export type {
    SuiteSyncStorage,
    CreateSuiteStorage,
    CreateSuiteStorageDep,
} from './SuiteSyncStorage';
export type { CreateSuiteSyncOwner, CreateSuiteSyncOwnerDep } from './Owner';
export { CreateSuiteSyncOwnerError } from './Owner';
export type { EntityListener, SuiteSyncTable } from './SuiteSyncTable';

/**
 * This below describes the Domain specific data structure.
 * This is the place where SuiteSync declares what Entities (tables)
 * stores.
 */
export type { SuiteSyncSchema } from './data/SuiteSyncSchema';
export type { AddressTable, SuiteSyncAddress } from './data/AddressTable';
export type { OutputTable, SuiteSyncOutput } from './data/OutputTable';
export type { WalletTable, SuiteSyncWallet } from './data/WalletTable';
export type { AccountTable, SuiteSyncAccount } from './data/AccountTable';
