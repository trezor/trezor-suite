export { LocalFirstStorageProvider } from './LocalFirstStorageProvider';

// Todo: this shared object shall be handled by Dependency Injection, this is madness
export {
    subscriptionStorage,
    getLocalFirstStorageProvider,
    setLocalFirstStorageProvider,
    localFirstStorageProvider,
} from './sharedObjects';

export type { SuiteSyncStorage } from './SuiteSyncStorage';

// Labeling
export type { AddressLabelsStore, AddressLabel } from './labeling/AddressLabelsStore';
export type { OutputLabelsStore, OutputLabel } from './labeling/OutputLabelsStore';
export type { WalletLabelsStore, WalletLabel } from './labeling/WalletLabelsStore';
export type { AccountLabelsStore, AccountLabel } from './labeling/AccountLabelsStore';
