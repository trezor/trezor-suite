import { type StorageId } from './suiteSyncStorageRepository';

export type SubscriptionStorageParams = {
    storageId: StorageId;
    unsubscribe: () => void;
};

export type SubscriptionStorage = {
    add: (params: SubscriptionStorageParams) => void;
    dispose: (storageId: StorageId) => void;
    has: (storageId: StorageId) => boolean;
};

export type SubscriptionStorageDep = {
    subscriptionStorage: SubscriptionStorage;
};
