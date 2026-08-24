import { protobufManager } from '@trezor/protobuf';

import { loadProtobufModules } from './protobufLoader';

/**
 * WHAT THIS GUARDS. `loadProtobufModules` names every generated definition module one by one, and
 * WARD is spread across THREE of them -- shared types, the connect-only messages, and the messages
 * that exist only when the device serves WARD over its own channel. A file missing from that list
 * still TYPE-CHECKS perfectly, because the types come from `definitions/index.ts` while the
 * descriptors come from this list: the failure surfaces at runtime, as a wire message that cannot
 * be decoded, which is the most expensive way to find out.
 *
 * So the assertion is deliberately about the REGISTRY rather than about behaviour: each message is
 * looked up and, where it has one, its wire number is checked. A wire number is the one property no
 * amount of nearby code can supply -- it comes from `MessageType` in `messages.proto` -- so getting
 * it back proves the descriptor really was loaded rather than something similarly-named being
 * found.
 */
describe('loadProtobufModules: the WARD message set', () => {
    beforeAll(async () => {
        await loadProtobufModules();
    });

    // Both transports, side by side, because that is the point: which one a firmware speaks is a
    // build option it does not report, so this host must be able to decode either answer to the
    // same request. `WardSetEntry` is answered by WardLeafAck on one build and by
    // WardMutationApplied on the other.
    it.each([
        ['WardSetEntry', 2303],
        ['WardLeafAck', 2305],
        ['WardMutationApplied', 2339],
        ['WardFlushQueue', 2321],
        ['WardFlushQueueAck', 2329],
        ['WardFlushQueueApplied', 2340],
    ])('%s is registered with wire number %i', (name, wire) => {
        expect(protobufManager.findSchema(name as string).messageType).toBe(wire);
    });

    // The service messages that cross the DEVICE's own interface rather than this connection. A
    // wallet host never sends or receives them -- but they share `messages.proto`, and leaving the
    // file out of the loader would take the two messages above with it, so they are the canary.
    it.each(['WardServiceOpen', 'WardSyncRequest', 'WardPublish', 'WardPublishAck'])(
        '%s is registered',
        name => {
            expect(() => protobufManager.findSchema(name)).not.toThrow();
        },
    );

    // A round trip, so the claim is not only that the descriptor is present but that it describes
    // the fields the device actually sends. `entry_key` is `bytes`, which crosses this boundary as
    // hex -- the one encoding decision in the whole message.
    it('WardMutationApplied round-trips', () => {
        const entry_key = 'aa'.repeat(32);
        const { message } = protobufManager.encode('WardMutationApplied', {
            entry_key,
            counter: 7,
        });

        expect(protobufManager.decode('WardMutationApplied', message).message).toMatchObject({
            entry_key,
            counter: 7,
        });
    });

    // `remaining` specifically: the host drains its queue by flushing while this is non-zero, so a
    // field silently absent from the schema would strand every queued change after the first.
    it('WardFlushQueueApplied round-trips, remaining included', () => {
        const { message } = protobufManager.encode('WardFlushQueueApplied', {
            entry_key: 'bb'.repeat(32),
            counter: 3,
            remaining: 2,
        });

        expect(protobufManager.decode('WardFlushQueueApplied', message).message).toMatchObject({
            counter: 3,
            remaining: 2,
        });
    });
});
