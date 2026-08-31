import WardResetApp from './wardResetApp';

// The method is a bare pass-through, so the only things worth pinning are the two that a caller
// cannot recover: that it sends NO parameters (its subject is who may use WARD, not which entry), and
// that `was_bound` survives -- it is the difference between "a pin was retired" and "there was none",
// which success alone does not carry.
const makeMethod = (response: Record<string, unknown>) => {
    const typedCall = jest.fn().mockResolvedValue({ type: 'WardResetAppAck', message: response });
    const instance = new WardResetApp({ payload: { method: 'wardResetApp' } } as any);
    instance.getDevice = () => ({ getCommands: () => ({ typedCall }) }) as any;

    return { method: instance, typedCall };
};

describe('WardResetApp', () => {
    it('sends an empty request and expects the ack', async () => {
        const { method, typedCall } = makeMethod({ was_bound: true });

        await method.run();

        expect(typedCall).toHaveBeenCalledWith('WardResetApp', 'WardResetAppAck', {});
    });

    it('reports that a pin was retired', async () => {
        const { method } = makeMethod({ was_bound: true });

        await expect(method.run()).resolves.toEqual({ was_bound: true });
    });

    it('reports an unclaimed device as such rather than as a failure', async () => {
        // Resetting a device nobody had claimed is a legitimate thing to do -- a caller recovering a
        // lost app cannot know in advance whether a pin exists -- so it succeeds and says so.
        const { method } = makeMethod({ was_bound: false });

        await expect(method.run()).resolves.toEqual({ was_bound: false });
    });

    it('takes no parameters, so a caller cannot aim it at an entry', () => {
        // The wire message has no fields. A payload carrying an entry would be a caller believing
        // this revokes access to one thing rather than to WARD as a whole.
        const { method, typedCall } = makeMethod({ was_bound: false });

        return method.run().then(() => {
            expect(typedCall.mock.calls[0]?.[2]).toEqual({});
        });
    });
});
