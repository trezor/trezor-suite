import {
    SuiteSyncStorageRepository,
    UnsubscribeSuiteSyncStorage,
} from '@suite-common/suite-sync-storage';

import { SubscriptionStorage } from './subscriptionStorage';

type CreateUnsubscribeSuiteSyncStorageDeps = {
    suiteSyncStorageRepository: SuiteSyncStorageRepository;
    subscriptionStorage: SubscriptionStorage;
};

export const createUnsubscribeSuiteSyncStorage =
    (deps: CreateUnsubscribeSuiteSyncStorageDeps): UnsubscribeSuiteSyncStorage =>
    async ({ device }) => {
        const owner = device.suiteSyncOwner;

        if (owner === undefined) {
            return;
        }

        deps.subscriptionStorage.disposeAll(owner.ownerId);
        await deps.suiteSyncStorageRepository.delete(owner.ownerId);
    };
