import { StorageId } from './suiteSyncStorageRepository';

export type SubscriptionStorageParams = {
    storageId: StorageId;
    unsubscribe: () => void;
};

export type SubscriptionStorage = {
    add: (params: SubscriptionStorageParams) => void;
    disposeAll: (storageId: StorageId) => void;
};

export type SubscriptionStorageDep = {
    subscriptionStorage: SubscriptionStorage;
};
