import WardQueueSetEntry from './wardQueueSetEntry';
import WardSetEntry from './wardSetEntry';

// Both methods are thin, deliberate pass-throughs, and what is worth pinning is that they are
// SEPARATE: an applying write and a queued one are different requests with different acks, so
// neither method can return the other's shape and no caller has to inspect a flag to find out
// which happened.
const makeMethod = (
    Method: typeof WardSetEntry | typeof WardQueueSetEntry,
    method: 'wardSetEntry' | 'wardQueueSetEntry',
    payload: Record<string, unknown>,
    response: Record<string, unknown>,
    type = 'WardLeafAck',
) => {
    const typedCall = jest.fn().mockResolvedValue({ type, message: response });
    const instance = new Method({ payload: { method, ...payload } } as any);
    instance.getDevice = () => ({ getCommands: () => ({ typedCall }) }) as any;

    return { method: instance, typedCall };
};

const PARAMS = { app_id: 'example.com', identifier: 'aabb', value: 'ccdd' };

describe('WardSetEntry', () => {
    it("sends exactly app_id, identifier and value, accepting either build's ack", async () => {
        const { method, typedCall } = makeMethod(WardSetEntry, 'wardSetEntry', PARAMS, {
            entry_key: '00'.repeat(32),
            counter: 4,
        });

        await method.run();

        // TWO expected types, and they are the two BUILDS rather than two outcomes: a device that
        // serves WARD over its own channel answers WardMutationApplied, and which transport a
        // firmware uses is not something it reports. An unsynced write is refused either way, so
        // there is still no third shape.
        expect(typedCall).toHaveBeenCalledWith(
            'WardSetEntry',
            ['WardLeafAck', 'WardMutationApplied'],
            PARAMS,
        );
    });

    it('returns the leaf ack verbatim, counter and authenticators included', async () => {
        const ack = {
            entry_key: '22'.repeat(32),
            identity: { encoding: 1 },
            content: { encoding: 1 },
            counter: 7,
            mac: '33'.repeat(32),
            auth_commit: '44'.repeat(32),
            auth_sig: '55'.repeat(64),
        };
        const { method } = makeMethod(WardSetEntry, 'wardSetEntry', PARAMS, ack);

        // TAGGED WITH THE TYPE, because the payload alone cannot say whether it must be stored.
        await expect(method.run()).resolves.toEqual({ type: 'WardLeafAck', message: ack });
    });

    it("returns the service build's receipt tagged as such, with no leaf invented", async () => {
        // A device that serves WARD over its own channel has ALREADY published this mutation and
        // heard it attested. There is nothing for the calling app to store -- it owns no replica --
        // and the fields say only what happened.
        const applied = { entry_key: '77'.repeat(32), counter: 9 };
        const { method } = makeMethod(
            WardSetEntry,
            'wardSetEntry',
            PARAMS,
            applied,
            'WardMutationApplied',
        );

        await expect(method.run()).resolves.toEqual({
            type: 'WardMutationApplied',
            message: applied,
        });
    });

    it('never turns one ack into the other', async () => {
        // THE FAILURE THIS GUARDS is a host that flattens the two: `apply` reads an absent content
        // body as a DELETION, so a receipt reshaped into a leaf would erase the entry the user just
        // wrote. Asserted as an absence, because that is how it would arrive.
        const { method } = makeMethod(
            WardSetEntry,
            'wardSetEntry',
            PARAMS,
            { entry_key: '88'.repeat(32), counter: 2 },
            'WardMutationApplied',
        );

        const result = (await method.run()) as { message: Record<string, unknown> };

        expect(result.message).not.toHaveProperty('identity');
        expect(result.message).not.toHaveProperty('content');
        expect(result.message).not.toHaveProperty('mac');
    });

    it('rejects a non-string identifier before anything reaches the device', () => {
        expect(
            () =>
                new WardSetEntry({
                    payload: { method: 'wardSetEntry', app_id: 'example.com', identifier: 1 },
                } as any),
        ).toThrow();
    });
});

describe('WardQueueSetEntry', () => {
    it('sends its own message and expects the queue ack', async () => {
        const { method, typedCall } = makeMethod(
            WardQueueSetEntry,
            'wardQueueSetEntry',
            PARAMS,
            { entry_key: '11'.repeat(32) },
            'WardQueueSetAck',
        );

        await method.run();

        expect(typedCall).toHaveBeenCalledWith('WardQueueSetEntry', 'WardQueueSetAck', PARAMS);
    });

    it('forwards `compact`, which changes how the device stores the entry', async () => {
        const params = { ...PARAMS, compact: true };
        const { method, typedCall } = makeMethod(
            WardQueueSetEntry,
            'wardQueueSetEntry',
            params,
            {},
            'WardQueueSetAck',
        );

        await method.run();

        expect(typedCall).toHaveBeenCalledWith('WardQueueSetEntry', 'WardQueueSetAck', params);
    });

    it('forwards the restore fields, which the device MACs and must get back unchanged', async () => {
        const backup = { ...PARAMS, mac: '66'.repeat(32) };
        const { method, typedCall } = makeMethod(
            WardQueueSetEntry,
            'wardQueueSetEntry',
            backup,
            { entry_key: '11'.repeat(32) },
            'WardQueueSetAck',
        );

        await method.run();

        // All four are inside the intent MAC, so dropping or altering one here would surface as a
        // device-side authentication failure rather than as a host bug.
        expect(typedCall).toHaveBeenCalledWith('WardQueueSetEntry', 'WardQueueSetAck', backup);
    });

    it('returns the empty ack as it stands -- there is no leaf, and no path, to invent', async () => {
        const { method } = makeMethod(
            WardQueueSetEntry,
            'wardQueueSetEntry',
            PARAMS,
            {},
            'WardQueueSetAck',
        );

        // The TYPE is the whole answer: the change was held, not applied. A method that filled in a
        // path here would be inventing one, since the device does not send it until the change
        // reaches the tree.
        await expect(method.run()).resolves.toEqual({});
    });
});
