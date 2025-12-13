import { StorageId, SubscriptionName, SubscriptionStorage } from '@suite-common/suite-sync-types';
import { typedObjectValues } from '@trezor/utils';

export const createSubscriptionStorage = (): SubscriptionStorage => {
    const storage: Record<StorageId, Partial<Record<SubscriptionName, () => void>>> = {};

    return {
        add: ({ unsubscribe, storageId, name }) => {
            if (storage[storageId] === undefined) {
                storage[storageId] = {};
            }

            // Defensive, if subscription already exists, we unsubscribe it
            const existingUnsubscribe = storage[storageId]?.[name];

            if (existingUnsubscribe !== undefined && existingUnsubscribe !== null) {
                existingUnsubscribe();
            }

            storage[storageId][name] = unsubscribe;
        },
        disposeAll: storageId => {
            typedObjectValues(storage[storageId] ?? {}).forEach(callback => callback?.());
            delete storage[storageId];
        },
    };
};
