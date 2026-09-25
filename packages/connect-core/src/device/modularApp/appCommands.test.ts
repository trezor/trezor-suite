import { protobufManager } from '@trezor/protobuf';

import { getModularAppTypedCall } from './appCommands';
import type { ModularAppDefinition } from './types';
import { loadProtobufModules } from '../../data/protobufLoader';

const APP: ModularAppDefinition = {
    id: 'test.app',
    binary: Buffer.alloc(0),
    proof: Buffer.alloc(0),
    rootPacket: Buffer.alloc(0),
    messageIds: {
        TronGetAddress: 0,
        TronAddress: 1,
    },
};

beforeAll(() => loadProtobufModules());

describe('modularApp/appCommands', () => {
    it('wraps the request in ExtAppMessage and decodes ExtAppResponse', async () => {
        // Device echoes back an encoded TronAddress under the app-local response id.
        const { message: responseData } = protobufManager.encode('TronAddress', {
            address: 'TXbCNc7Y4jJq3jVXvNjNmp3maHkNRZK4Gp',
        });

        const typedCall = jest.fn().mockResolvedValue({
            type: 'ExtAppResponse',
            message: { message_id: 1, data: responseData.toString('hex'), finished: true },
        });

        const appCall = getModularAppTypedCall(typedCall as never, APP, 42);
        const response = await appCall('TronGetAddress', 'TronAddress', {
            address_n: [0x8000002c, 0x800000c3, 0x80000000, 0, 0],
            show_display: false,
        });

        // Outgoing call is wrapped with the instance id and app-local request id.
        expect(typedCall).toHaveBeenCalledTimes(1);
        const [type, expected, payload] = typedCall.mock.calls[0];
        expect(type).toBe('ExtAppMessage');
        expect(expected).toBe('ExtAppResponse');
        expect(payload.instance_id).toBe(42);
        expect(payload.message_id).toBe(0);
        expect(typeof payload.data).toBe('string');

        // Incoming response is mapped back to the wire message name and decoded.
        expect(response.type).toBe('TronAddress');
        expect(response.message).toMatchObject({
            address: 'TXbCNc7Y4jJq3jVXvNjNmp3maHkNRZK4Gp',
        });
    });

    it('throws for an unmapped request message', async () => {
        const typedCall = jest.fn();
        const appCall = getModularAppTypedCall(typedCall as never, APP, 1);
        // TronSignTx has no id in APP.messageIds.
        await expect(appCall('TronSignTx', 'TronSignature', {} as never)).rejects.toThrow(
            /no message id/,
        );
        expect(typedCall).not.toHaveBeenCalled();
    });

    it('throws when the response id is not among the expected types', async () => {
        const { message: responseData } = protobufManager.encode('TronAddress', {
            address: 'TXbCNc7Y4jJq3jVXvNjNmp3maHkNRZK4Gp',
        });
        const typedCall = jest.fn().mockResolvedValue({
            type: 'ExtAppResponse',
            message: { message_id: 1, data: responseData.toString('hex'), finished: true },
        });

        const appCall = getModularAppTypedCall(typedCall as never, APP, 1);
        // Expecting TronGetAddress back (invalid, it is a request type) but the app returns id 1.
        await expect(
            appCall('TronGetAddress', 'TronGetAddress' as never, {} as never),
        ).rejects.toThrow(/unexpected/);
    });
});
