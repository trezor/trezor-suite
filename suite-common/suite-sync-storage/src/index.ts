export type {
    SuiteSyncStorageRepository,
    CreateSuiteSyncStorageRepository,
    CreateSuiteStorage,
} from './SuiteSyncStorageRepository';
export { createSuiteSyncStorageRepositoryFactory } from './SuiteSyncStorageRepository';
export type { SuiteSyncStorage } from './SuiteSyncStorage';
export type { CreateSuiteSyncOwner } from './Owner';
export type { SuiteSync, ChangeRelayUrlDep, ChangeRelayUrl } from './SuiteSync';

// Todo: this shared object shall be handled by Dependency Injection, this is madness
export { subscriptionStorage } from './sharedObjects';

// Labeling
export type { AddressLabelsStore, AddressLabel } from './labeling/AddressLabelsStore';
export type { OutputLabelsStore, OutputLabel } from './labeling/OutputLabelsStore';
export type { WalletLabelsStore, WalletLabel } from './labeling/WalletLabelsStore';
export type { AccountLabelsStore, AccountLabel } from './labeling/AccountLabelsStore';
