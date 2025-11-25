export type { SuiteSyncStorageRepository } from './SuiteSyncStorageRepository';
export type { CreateSuiteSyncStorageRepository } from './SuiteSyncStorageRepository';
export { createSuiteSyncStorageRepositoryFactory } from './SuiteSyncStorageRepository';
export type { CreateSuiteStorage } from './SuiteSyncStorageRepository';
export type { SuiteSyncStorage } from './SuiteSyncStorage';
export type { CreateSuiteSyncOwner } from './Owner';

// Todo: this shared object shall be handled by Dependency Injection, this is madness
export {
    subscriptionStorage,
    getSuiteSyncStorageProvider,
    setSuiteSyncProvider,
    suiteSyncStorages,
} from './sharedObjects';

// Labeling
export type { AddressLabelsStore, AddressLabel } from './labeling/AddressLabelsStore';
export type { OutputLabelsStore, OutputLabel } from './labeling/OutputLabelsStore';
export type { WalletLabelsStore, WalletLabel } from './labeling/WalletLabelsStore';
export type { AccountLabelsStore, AccountLabel } from './labeling/AccountLabelsStore';
