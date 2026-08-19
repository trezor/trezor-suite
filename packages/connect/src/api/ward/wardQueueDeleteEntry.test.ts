import WardQueueDeleteEntry from './wardQueueDeleteEntry';

// The discard is a pass-through, and `missing` is the field worth pinning: it comes back as an ACK,
// not as a Failure, because asking about a change that has already been published is ordinary.
const makeMethod = (payload: Record<string, unknown>, response: Record<string, unknown>) => {
    const typedCall = jest
        .fn()
        .mockResolvedValue({ type: 'WardQueueDeleteAck', message: response });
    const method = new WardQueueDeleteEntry({
        payload: { method: 'wardQueueDeleteEntry', ...payload },
    } as any);
    method.getDevice = () => ({ getCommands: () => ({ typedCall }) }) as any;

    return { method, typedCall };
};

const PARAMS = { app_id: 'example.com', identifier: 'aabb' };

describe('WardQueueDeleteEntry', () => {
    it('sends exactly app_id and identifier', async () => {
        const { method, typedCall } = makeMethod({ ...PARAMS, device: {} }, {});

        await method.run();

        expect(typedCall).toHaveBeenCalledWith(
            'WardQueueDeleteEntry',
            'WardQueueDeleteAck',
            PARAMS,
        );
    });

    it('returns the empty ack when a queued change was discarded', async () => {
        const { method } = makeMethod(PARAMS, {});

        await expect(method.run()).resolves.toEqual({});
    });

    it('passes `missing` through rather than turning it into a failure', async () => {
        const { method } = makeMethod(PARAMS, { missing: true });

        await expect(method.run()).resolves.toEqual({ missing: true });
    });
});
