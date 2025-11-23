export { LocalFirstStorageProvider } from './LocalFirstStorageProvider';
export type { SuiteStorageCreator } from './LocalFirstStorageProvider';
export type { SuiteSyncStorage } from './SuiteSyncStorage';
export type { CreateSuiteSyncOwner } from './Owner';

// Todo: this shared object shall be handled by Dependency Injection, this is madness
export {
    subscriptionStorage,
    getLocalFirstStorageProvider,
    setLocalFirstStorageProvider,
    localFirstStorageProvider,
} from './sharedObjects';

// Labeling
export type { AddressLabelsStore, AddressLabel } from './labeling/AddressLabelsStore';
export type { OutputLabelsStore, OutputLabel } from './labeling/OutputLabelsStore';
export type { WalletLabelsStore, WalletLabel } from './labeling/WalletLabelsStore';
export type { AccountLabelsStore, AccountLabel } from './labeling/AccountLabelsStore';
