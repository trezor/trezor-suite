import WardSetEntry from './wardSetEntry';

// The method is a thin, deliberate pass-through, and both halves of that are worth pinning: the
// params it puts on the wire, and the fact that it returns the ack UNTOUCHED. A queued ack is the
// case that matters -- it carries no leaf at all, and a method that "helpfully" filled one in
// would hand a host something to store for a change the device has not applied.
const makeMethod = (payload: Record<string, unknown>, response: Record<string, unknown>) => {
    const typedCall = jest.fn().mockResolvedValue({ type: 'WardLeafAck', message: response });
    const method = new WardSetEntry({
        payload: { method: 'wardSetEntry', ...payload },
    } as any);
    method.getDevice = () => ({ getCommands: () => ({ typedCall }) }) as any;

    return { method, typedCall };
};

describe('WardSetEntry', () => {
    it('sends exactly app_id, identifier and value', async () => {
        const { method, typedCall } = makeMethod(
            { app_id: 'example.com', identifier: 'aabb', value: 'ccdd', device: {} },
            { entry_key: '00'.repeat(32), queued: true },
        );

        await method.run();

        expect(typedCall).toHaveBeenCalledWith('WardSetEntry', 'WardLeafAck', {
            app_id: 'example.com',
            identifier: 'aabb',
            value: 'ccdd',
        });
    });

    it('returns a queued ack verbatim, with no leaf invented for it', async () => {
        const ack = { entry_key: '11'.repeat(32), queued: true };
        const { method } = makeMethod(
            { app_id: 'example.com', identifier: 'aabb', value: 'ccdd' },
            ack,
        );

        await expect(method.run()).resolves.toEqual(ack);
    });

    it('returns an applied ack verbatim, counter and authenticators included', async () => {
        const ack = {
            entry_key: '22'.repeat(32),
            identity: { encoding: 1 },
            content: { encoding: 1 },
            counter: 7,
            mac: '33'.repeat(32),
            auth_commit: '44'.repeat(32),
            auth_sig: '55'.repeat(64),
        };
        const { method } = makeMethod(
            { app_id: 'example.com', identifier: 'aabb', value: '' },
            ack,
        );

        await expect(method.run()).resolves.toEqual(ack);
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
