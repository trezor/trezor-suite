import { createOwnerWebSocketTransport } from '@evolu/common';

import {
    type SuiteSyncOwner,
    asSuiteSyncOwnerId,
    asSuiteSyncOwnerSecretHex,
} from '@suite-common/suite-sync-storage';

import { type CreateOwnerWebSocketTransport, createEvoluStorageFactory } from './evoluStorage';

const suiteSyncOwner: SuiteSyncOwner = {
    ownerId: asSuiteSyncOwnerId('yg0UgROParTpm60ltI3hDw'),
    ownerSecret: asSuiteSyncOwnerSecretHex('e17818d7'),
};

const appOwner = { id: 'owner-id' };

/**
 * Relay subscriptions and sync requests, as a log of what the storage asked Evolu to do.
 *
 * Which relay a subscription points at is a question about the order of unsubscribe and subscribe
 * calls, and a resync has to be told apart from a resubscribe, so the log records all three rather
 * than reaching for a real Evolu and a socket.
 */
const createEvoluDouble = () => {
    const calls: string[] = [];
    let subscriptionCount = 0;

    const useOwner = jest.fn(
        (_owner: unknown, transports: ReturnType<CreateOwnerWebSocketTransport>[]) => {
            const id = ++subscriptionCount;
            calls.push(`subscribe#${id} ${transports.map(transport => transport.url).join()}`);

            return () => calls.push(`unsubscribe#${id}`);
        },
    );

    const requestSync = jest.fn((ownerId: string) => {
        calls.push(`requestSync ${ownerId}`);
    });

    const evolu = {
        appOwner: Promise.resolve(appOwner),
        useOwner,
        requestSync,
        [Symbol.asyncDispose]: jest.fn(() => Promise.resolve()),
    };

    return { calls, useOwner, requestSync, evolu };
};

const createStorage = (evolu: ReturnType<typeof createEvoluDouble>['evolu']) =>
    createEvoluStorageFactory({
        evoluInstanceFactory: () => Promise.resolve(evolu as never),
        createOwnerWebSocketTransport,
    })({ suiteSyncOwner });

describe('evolu storage relay subscription', () => {
    it('does not subscribe or resync before a relay is known', async () => {
        const { calls, useOwner, requestSync, evolu } = createEvoluDouble();
        const storage = await createStorage(evolu);

        await storage.forceResync();

        expect(useOwner).not.toHaveBeenCalled();
        expect(requestSync).not.toHaveBeenCalled();
        expect(calls).toEqual([]);
    });

    it('subscribes to the relay it is given', async () => {
        const { calls, evolu } = createEvoluDouble();
        const storage = await createStorage(evolu);

        await storage.updateRelayUrl('ws://relay.example.com');

        expect(calls).toEqual(['subscribe#1 ws://relay.example.com?ownerId=owner-id']);
    });

    it('resyncs over the existing subscription instead of resubscribing', async () => {
        const { calls, evolu } = createEvoluDouble();
        const storage = await createStorage(evolu);
        await storage.updateRelayUrl('ws://relay.example.com');

        await storage.forceResync();

        // Keeping the subscription is the point: dropping and recreating it leaves the relay with
        // no subscriber, so the rejected writes a resync exists to retry are never sent.
        expect(calls).toEqual([
            'subscribe#1 ws://relay.example.com?ownerId=owner-id',
            'requestSync owner-id',
        ]);
    });

    it('moves the subscription when the relay changes', async () => {
        const { calls, evolu } = createEvoluDouble();
        const storage = await createStorage(evolu);
        await storage.updateRelayUrl('ws://first.example.com');

        await storage.updateRelayUrl('ws://second.example.com');

        expect(calls).toEqual([
            'subscribe#1 ws://first.example.com?ownerId=owner-id',
            'unsubscribe#1',
            'subscribe#2 ws://second.example.com?ownerId=owner-id',
        ]);
    });

    it('resubscribes when the same relay url is set again', async () => {
        const { calls, evolu } = createEvoluDouble();
        const storage = await createStorage(evolu);
        await storage.updateRelayUrl('ws://relay.example.com');

        await storage.updateRelayUrl('ws://relay.example.com');

        // An unchanged url is not a reason to skip the work: updateRelayUrl builds a fresh
        // transport unconditionally, so a relay that dropped the connection gets a new one.
        expect(calls).toEqual([
            'subscribe#1 ws://relay.example.com?ownerId=owner-id',
            'unsubscribe#1',
            'subscribe#2 ws://relay.example.com?ownerId=owner-id',
        ]);
    });

    it('stays disconnected after disconnectRelay, however often a resync is asked for', async () => {
        const { calls, requestSync, evolu } = createEvoluDouble();
        const storage = await createStorage(evolu);
        await storage.updateRelayUrl('ws://relay.example.com');

        await storage.disconnectRelay();
        await storage.forceResync();
        await storage.forceResync();

        expect(requestSync).not.toHaveBeenCalled();
        expect(calls).toEqual([
            'subscribe#1 ws://relay.example.com?ownerId=owner-id',
            'unsubscribe#1',
        ]);
    });

    it('stays disconnected after dispose', async () => {
        const { calls, requestSync, evolu } = createEvoluDouble();
        const storage = await createStorage(evolu);
        await storage.updateRelayUrl('ws://relay.example.com');

        await storage.dispose();
        await storage.forceResync();

        expect(requestSync).not.toHaveBeenCalled();
        expect(calls).toEqual([
            'subscribe#1 ws://relay.example.com?ownerId=owner-id',
            'unsubscribe#1',
        ]);
        expect(evolu[Symbol.asyncDispose]).toHaveBeenCalledTimes(1);
    });
});
