import { SuiteSyncOwnerId } from '@suite-common/suite-types';

/**
 * SuiteSync can handle multiple domains.
 * Currently, we have "labeling" only.
 */
export type SubscriptionName = 'labeling';

export type SubscriptionStorageParams = {
    ownerId: SuiteSyncOwnerId;
    unsubscribe: () => void;
    name: SubscriptionName;
};

export type SubscriptionStorage = {
    add: (params: SubscriptionStorageParams) => void;
    disposeAll: (ownerId: SuiteSyncOwnerId) => void;
};

export type SubscriptionStorageDep = {
    subscriptionStorage: SubscriptionStorage;
};
