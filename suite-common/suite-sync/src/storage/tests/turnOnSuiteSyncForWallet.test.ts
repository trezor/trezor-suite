import { asSuiteSyncOwnerId } from '@suite-common/suite-types';

import { createSubscriptionStorage } from '../subscriptionStorage';

const ownerId1 = asSuiteSyncOwnerId('1');
const ownerId2 = asSuiteSyncOwnerId('2');

describe(createSubscriptionStorage.name, () => {
    it('subscribes multiple owners and dispose just one', () => {
        const storage = createSubscriptionStorage();

        let isOwnerID1Unsubscribed = false;
        let isOwnerID2Unsubscribed = false;

        storage.add({
            ownerId: ownerId1,
            name: 'labeling',
            unsubscribe: () => {
                isOwnerID1Unsubscribed = true;
            },
        });
        storage.add({
            ownerId: ownerId2,
            name: 'labeling',
            unsubscribe: () => {
                isOwnerID2Unsubscribed = true;
            },
        });

        storage.disposeAll(ownerId1);
        expect(isOwnerID1Unsubscribed).toBe(true);
        expect(isOwnerID2Unsubscribed).toBe(false);
    });

    it('unsubscribes previously subscribed handler', () => {
        const storage = createSubscriptionStorage();

        let isUnsubscribed = false;

        storage.add({
            ownerId: ownerId1,
            name: 'labeling',
            unsubscribe: () => {
                isUnsubscribed = true;
            },
        });
        expect(isUnsubscribed).toBe(false);

        storage.add({
            ownerId: ownerId1,
            name: 'labeling',
            unsubscribe: () => {},
        });
        expect(isUnsubscribed).toBe(true);
    });
});
