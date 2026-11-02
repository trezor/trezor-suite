import { thpCall } from './thpCall';
import type { IDevice } from '../../types/idevice';

const getDevice = (payloads: Record<string, any>[]) => {
    const call = jest.fn(() => Promise.resolve({ success: true, payload: payloads.shift() }));

    const device = {
        getThpState: () => ({ setCancelablePromise: jest.fn() }),
        getCurrentSession: () => ({ call }),
        emit: jest.fn(),
    } as unknown as IDevice;

    return { device, call };
};

describe('thpCall', () => {
    it('rejects an unexpected response received after a ButtonRequest', async () => {
        const { device } = getDevice([
            { type: 'ButtonRequest', message: { code: 'ButtonRequest_Other' } },
            { type: 'ThpCredentialResponse', message: {} },
        ]);

        await expect(
            thpCall(device, 'ThpPairingRequest', { host_name: 'host', app_name: 'app' }),
        ).rejects.toThrow('Unexpected response type: ThpCredentialResponse');
    });

    it('accepts an allowed response received after a ButtonRequest', async () => {
        const { device, call } = getDevice([
            { type: 'ButtonRequest', message: { code: 'ButtonRequest_Other' } },
            { type: 'ThpPairingRequestApproved', message: {} },
        ]);

        const result = await thpCall(device, 'ThpPairingRequest', {
            host_name: 'host',
            app_name: 'app',
        });

        expect(result.type).toEqual('ThpPairingRequestApproved');
        expect(call).toHaveBeenNthCalledWith(2, 'ButtonAck', {});
    });

    it('rejects an unexpected response received without a ButtonRequest', async () => {
        const { device } = getDevice([{ type: 'ThpEndResponse', message: {} }]);

        await expect(
            thpCall(device, 'ThpCredentialRequest', {
                autoconnect: false,
                host_static_public_key: 'deadbeef',
            }),
        ).rejects.toThrow('Unexpected response type: ThpEndResponse');
    });
});
