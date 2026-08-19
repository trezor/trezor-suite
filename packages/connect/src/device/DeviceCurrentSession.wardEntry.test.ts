import { DEVICE } from '@trezor/connect-common';
import type { Session, Transport } from '@trezor/transport-common';

import { DeviceCurrentSession } from './DeviceCurrentSession';
import type { IDevice } from '../types/idevice';

// The WARD loopback: firmware interrupts a call with WardEntryRequest and the host must answer
// WardEntryAck on the SAME call. Driven at the transport boundary (queued MessageResponses) so the
// test covers the callLoop arm itself, not protobuf framing.

const ACK = { proof: [], witness_entry_key: 'aa', witness_commit: 'bb' };

const setup = (responses: { type: string; message: any }[]) => {
    const calls: { name: string; data: any }[] = [];
    const transport = {
        deviceEvents: { once: () => {} },
        call: ({ name, data }: { name: string; data: any }) => {
            calls.push({ name, data });
            const payload = responses.shift();

            return Promise.resolve(
                payload
                    ? { success: true as const, payload }
                    : { success: false as const, error: { code: 'unexpected-call' } },
            );
        },
    } as unknown as Transport;

    const prompt = jest.fn();
    const device = {
        transportPath: 'path',
        protocol: undefined,
        features: { session_id: 'session-id', unlocked: true },
        getThpState: () => undefined,
        prompt,
    } as unknown as IDevice;

    const session = new DeviceCurrentSession(
        device,
        transport,
        '1' as Session,
        {
            debug: () => {},
            warn: () => {},
        } as any,
    );

    return { session, calls, prompt };
};

describe('DeviceCurrentSession: WardEntryRequest loopback', () => {
    it('answers the device pull with WardEntryAck and resumes the same call', async () => {
        const { session, calls, prompt } = setup([
            { type: 'WardEntryRequest', message: { entry_key: 'ff' } },
            { type: 'WardLeafAck', message: { entry_key: 'ff', counter: 3 } },
        ]);
        prompt.mockResolvedValue({ success: true, payload: ACK });

        const result = await session.typedCall('WardGetEntry', 'WardLeafAck', {
            app_id: 'TEST',
            identifier: 'entry',
        });

        expect(prompt).toHaveBeenCalledWith(DEVICE.WARD_ENTRY, { request: { entry_key: 'ff' } });
        expect(calls.map(c => c.name)).toEqual(['WardGetEntry', 'WardEntryAck']);
        expect(calls[1]?.data).toEqual(ACK);
        expect(result.message).toEqual({ entry_key: 'ff', counter: 3 });
    });

    it('cancels the call when the provider fails, instead of leaving the device waiting', async () => {
        const { session, calls, prompt } = setup([
            { type: 'WardEntryRequest', message: { entry_key: 'ff' } },
            { type: 'Success', message: {} },
        ]);
        prompt.mockResolvedValue({
            success: false,
            error: new Error('wardProvider.serveEntry is not implemented'),
        });

        await expect(
            session.typedCall('WardGetEntry', 'WardLeafAck', { app_id: 'TEST', identifier: 'e' }),
        ).rejects.toThrow('wardProvider.serveEntry is not implemented');

        expect(calls.map(c => c.name)).toEqual(['WardGetEntry', 'Cancel']);
    });
});
