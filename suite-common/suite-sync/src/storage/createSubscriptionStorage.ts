import { type StorageId, type SubscriptionStorage } from '@suite-common/suite-sync-types';

export const createSubscriptionStorage = (): SubscriptionStorage => {
    const storage: Record<StorageId, () => void> = {};

    return {
        add: ({ unsubscribe, storageId }) => {
            // Defensive, if subscription already exists, we unsubscribe it
            const existingUnsubscribe = storage[storageId];

            if (existingUnsubscribe !== undefined) {
                existingUnsubscribe();
            }

            storage[storageId] = unsubscribe;
        },
        dispose: storageId => {
            storage[storageId]?.();
            delete storage[storageId];
        },
        has: (storageId): boolean => storageId in storage,
    };
};
