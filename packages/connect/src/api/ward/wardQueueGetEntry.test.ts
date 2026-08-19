import WardQueueGetEntry from './wardQueueGetEntry';

// The export is a pass-through, and the field that matters is `mac`: it is what makes the ack a
// BACKUP rather than a report, and a method that filtered or interpreted it would leave the caller
// unable to restore anything.
const makeMethod = (payload: Record<string, unknown>, response: Record<string, unknown>) => {
    const typedCall = jest.fn().mockResolvedValue({ type: 'WardQueueGetAck', message: response });
    const method = new WardQueueGetEntry({
        payload: { method: 'wardQueueGetEntry', ...payload },
    } as any);
    method.getDevice = () => ({ getCommands: () => ({ typedCall }) }) as any;

    return { method, typedCall };
};

const PARAMS = { app_id: 'example.com', identifier: 'aabb' };

describe('WardQueueGetEntry', () => {
    it('sends exactly app_id and identifier', async () => {
        const { method, typedCall } = makeMethod({ ...PARAMS, device: {} }, { missing: true });

        await method.run();

        expect(typedCall).toHaveBeenCalledWith('WardQueueGetEntry', 'WardQueueGetAck', PARAMS);
    });

    it('returns a queued export verbatim, mac included', async () => {
        const ack = {
            pending: true,
            key_type: 'address',
            app_id: 'example.com',
            identifier: 'aabb',
            value: 'ccdd',
            mac: '77'.repeat(32),
        };
        const { method } = makeMethod(PARAMS, ack);

        await expect(method.run()).resolves.toEqual(ack);
    });

    it('returns a pinned copy verbatim too, with no mac to restore from', async () => {
        const ack = { key_type: 'address', app_id: 'example.com', identifier: 'aabb', value: 'ee' };
        const { method } = makeMethod(PARAMS, ack);

        const result = await method.run();

        expect(result).toEqual(ack);
        expect('mac' in result).toBe(false);
    });

    it('reports a miss as a miss rather than as an empty record', async () => {
        const { method } = makeMethod(PARAMS, { missing: true });

        await expect(method.run()).resolves.toEqual({ missing: true });
    });
});
