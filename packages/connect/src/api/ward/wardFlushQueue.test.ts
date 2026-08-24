import WardFlushQueue from './wardFlushQueue';

// The method is a thin pass-through, so what is worth pinning is the three things a caller cannot
// recover if this gets them wrong: WHICH message goes out, that BOTH acks are accepted (they are
// the two builds, not two outcomes), and that `remaining` survives -- the draining loop is written
// against it, and a host that loses it publishes one queued change and strands the rest.
const makeMethod = (
    payload: Record<string, unknown>,
    response: Record<string, unknown>,
    type = 'WardFlushQueueAck',
) => {
    const typedCall = jest.fn().mockResolvedValue({ type, message: response });
    const instance = new WardFlushQueue({
        payload: { method: 'wardFlushQueue', ...payload },
    } as any);
    instance.getDevice = () => ({ getCommands: () => ({ typedCall }) }) as any;

    return { method: instance, typedCall };
};

const LEAF_ACK = {
    entry_key: '11'.repeat(32),
    identity: { encoding: 1 },
    content: { encoding: 1 },
    counter: 5,
    mac: '22'.repeat(32),
    auth_commit: '33'.repeat(32),
    auth_sig: '44'.repeat(64),
    remaining: 2,
};

describe('WardFlushQueue', () => {
    it('publishes the NEXT queued change when no entry is named', async () => {
        const { method, typedCall } = makeMethod({}, LEAF_ACK);

        await method.run();

        // Both fields present and undefined: the device reads "unnamed" from their absence, and
        // this method does not decide on its behalf what unnamed means.
        expect(typedCall).toHaveBeenCalledWith(
            'WardFlushQueue',
            ['WardFlushQueueAck', 'WardFlushQueueApplied'],
            { app_id: undefined, identifier: undefined },
        );
    });

    it('publishes a NAMED change, which is the only way a compact record can be published', async () => {
        const named = { app_id: 'example.com', identifier: 'aabb' };
        const { method, typedCall } = makeMethod(named, LEAF_ACK);

        await method.run();

        expect(typedCall).toHaveBeenCalledWith(
            'WardFlushQueue',
            ['WardFlushQueueAck', 'WardFlushQueueApplied'],
            named,
        );
    });

    it('passes a half-named entry through rather than second-guessing the device', async () => {
        // "Both or neither" is the DEVICE's rule, and it treats a half-named request as unnamed.
        // Enforcing that here as well would put the judgement in two places, which is how the two
        // stop agreeing -- and the disagreement would surface as a change published that the caller
        // did not ask for.
        const { method, typedCall } = makeMethod({ app_id: 'example.com' }, LEAF_ACK);

        await method.run();

        expect(typedCall).toHaveBeenCalledWith(
            'WardFlushQueue',
            ['WardFlushQueueAck', 'WardFlushQueueApplied'],
            { app_id: 'example.com', identifier: undefined },
        );
    });

    it('returns the leaf ack tagged, remaining included', async () => {
        const { method } = makeMethod({}, LEAF_ACK);

        await expect(method.run()).resolves.toEqual({
            type: 'WardFlushQueueAck',
            message: LEAF_ACK,
        });
    });

    it("returns the service build's receipt tagged as such, remaining included", async () => {
        // No leaf, because on this build the device published to its own daemon and this host owns
        // no replica to store one in. `remaining` is the field that must survive regardless: it is
        // how the caller knows to flush again.
        const applied = { entry_key: '55'.repeat(32), counter: 6, remaining: 1 };
        const { method } = makeMethod({}, applied, 'WardFlushQueueApplied');

        await expect(method.run()).resolves.toEqual({
            type: 'WardFlushQueueApplied',
            message: applied,
        });
    });

    it('reports an empty drain as remaining: 0 rather than as a failure', async () => {
        // Nothing was queued, so nothing was published: no transition, no claim. The caller's loop
        // ends on the zero, and an empty queue is an answer rather than an error.
        const { method } = makeMethod({}, { remaining: 0 }, 'WardFlushQueueApplied');

        await expect(method.run()).resolves.toEqual({
            type: 'WardFlushQueueApplied',
            message: { remaining: 0 },
        });
    });
});
