import { SubscriptionName, SubscriptionStorage } from '@suite-common/suite-sync-types';
import { SuiteSyncOwnerId } from '@suite-common/suite-types';
import { typedObjectValues } from '@trezor/utils';

export const createSubscriptionStorage = (): SubscriptionStorage => {
    const storage: Record<SuiteSyncOwnerId, Partial<Record<SubscriptionName, () => void>>> = {};

    return {
        add: ({ unsubscribe, ownerId, name }) => {
            if (storage[ownerId] === undefined) {
                storage[ownerId] = {};
            }

            // Defensive, if subscription already exists, we unsubscribe it
            const existingUnsubscribe = storage[ownerId]?.[name];

            if (existingUnsubscribe !== undefined && existingUnsubscribe !== null) {
                existingUnsubscribe();
            }

            storage[ownerId][name] = unsubscribe;
        },
        disposeAll: (ownerId: SuiteSyncOwnerId) => {
            typedObjectValues(storage[ownerId] ?? {}).forEach(callback => callback?.());
            delete storage[ownerId];
        },
    };
};
