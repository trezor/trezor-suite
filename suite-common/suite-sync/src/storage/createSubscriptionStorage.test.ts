import { createSubscriptionStorage } from './createSubscriptionStorage';
import { asStorageId } from './createSuiteSyncStorageRepository';

const storageId1 = asStorageId('1');
const storageId2 = asStorageId('2');

describe(createSubscriptionStorage.name, () => {
    it('subscribes multiple owners and dispose just one', () => {
        const storage = createSubscriptionStorage();

        let isOwnerID1Unsubscribed = false;
        let isOwnerID2Unsubscribed = false;

        storage.add({
            storageId: storageId1,
            unsubscribe: () => {
                isOwnerID1Unsubscribed = true;
            },
        });
        storage.add({
            storageId: storageId2,
            unsubscribe: () => {
                isOwnerID2Unsubscribed = true;
            },
        });

        storage.dispose(storageId1);
        expect(isOwnerID1Unsubscribed).toBe(true);
        expect(isOwnerID2Unsubscribed).toBe(false);
    });

    it('unsubscribes previously subscribed handler', () => {
        const storage = createSubscriptionStorage();

        let isUnsubscribed = false;

        storage.add({
            storageId: storageId1,
            unsubscribe: () => {
                isUnsubscribed = true;
            },
        });
        expect(isUnsubscribed).toBe(false);

        storage.add({
            storageId: storageId1,
            unsubscribe: () => {},
        });
        expect(isUnsubscribed).toBe(true);
    });
});
