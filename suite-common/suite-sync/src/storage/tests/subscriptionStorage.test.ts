import { asSuiteSyncOwnerId } from '@suite-common/suite-types';

import { createSubscriptionStorage } from '../subscriptionStorage';

const ownerId1 = asSuiteSyncOwnerId('1');
const ownerId2 = asSuiteSyncOwnerId('1');

describe(createSubscriptionStorage.name, () => {
    it('subscribe/unsubscribe', () => {
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

        storage.disposeAll(ownerId2);
        expect(isUnsubscribed).toBe(false);

        storage.disposeAll(ownerId2);
        expect(isUnsubscribed).toBe(true);
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
