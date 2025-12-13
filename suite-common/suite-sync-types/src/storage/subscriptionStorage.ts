import { StorageId } from './suiteSyncStorageRepository';

/**
 * SuiteSync can handle multiple domains.
 * Currently, we have "labeling" only.
 */
export type SubscriptionName = 'labeling';

export type SubscriptionStorageParams = {
    storageId: StorageId;
    unsubscribe: () => void;
    name: SubscriptionName;
};

export type SubscriptionStorage = {
    add: (params: SubscriptionStorageParams) => void;
    disposeAll: (storageId: StorageId) => void;
};

export type SubscriptionStorageDep = {
    subscriptionStorage: SubscriptionStorage;
};
