export type {
    SuiteSyncStorage,
    CreateSuiteStorage,
    CreateSuiteStorageDep,
} from './SuiteSyncStorage';

export type { CreateSuiteSyncOwner, CreateSuiteSyncOwnerDep } from './Owner';
export { CreateSuiteSyncOwnerError } from './Owner';

/**
 * This below describes the Domain specific data structure.
 * This is the place where SuiteSync declares what Entities (tables)
 * stores.
 */
export type { AddressTable, AddressLabel } from './data/AddressTable';
export type { OutputTable, OutputLabel } from './data/OutputTable';
export type { WalletTable, WalletLabel } from './data/WalletTable';
export type { AccountTable, Account } from './data/AccountTable';
