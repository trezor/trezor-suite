export type {
    SuiteSyncStorage,
    CreateSuiteStorage,
    CreateSuiteStorageDep,
} from './SuiteSyncStorage';
export type { CreateSuiteSyncOwner, CreateSuiteSyncOwnerDep } from './Owner';
export { CreateSuiteSyncOwnerError } from './Owner';
export type { EntityListener, SuiteSyncTable, SuiteSyncUpdateError } from './SuiteSyncTable';
export { createSuiteSyncUpdateError } from './SuiteSyncTable';

/**
 * This below describes the Domain specific data structure.
 * This is the place where SuiteSync declares what Entities (tables)
 * stores.
 */
export type { SuiteSyncSchema } from './data/SuiteSyncSchema';
export type { WalletTable, SuiteSyncWallet } from './data/WalletTable';
export type { AddressTable, SuiteSyncAddress } from './data/AddressTable';
export { createSuiteSyncAddressId } from './data/AddressTable';
export type { OutputTable, SuiteSyncOutput } from './data/OutputTable';
export { createSuiteSyncOutputId } from './data/OutputTable';
export type { AccountTable, SuiteSyncAccount } from './data/AccountTable';
export { createSuiteSyncAccountId } from './data/AccountTable';
