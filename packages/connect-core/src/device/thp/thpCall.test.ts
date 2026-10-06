import { thp as protocolThp } from '@trezor/protocol';
import type { MessageResponse } from '@trezor/transport-common';

import { thpCall } from './thpCall';
import type { IDevice } from '../../types/idevice';

const buttonRequest: MessageResponse = {
    type: 'ButtonRequest',
    message: { code: 'ButtonRequest_PassphraseEntry' },
};
const success: MessageResponse = { type: 'Success', message: { message: '' } };

const createDevice = (replies: MessageResponse[]) => {
    const sent: string[] = [];
    const session = {
        call: (name: string) => {
            sent.push(name);

            return Promise.resolve({ success: true, payload: replies.shift() });
        },
    };
    const device = {
        getThpState: () => new protocolThp.ThpState(),
        getCurrentSession: () => session,
        emit: jest.fn(),
    } as unknown as IDevice;

    return { device, sent };
};

const createNewSession = (device: IDevice) =>
    thpCall(device, 'ThpCreateNewSession', { on_device: true });

describe('thpCall', () => {
    it('returns the expected response after a ButtonRequest', async () => {
        const { device, sent } = createDevice([buttonRequest, success]);

        await expect(createNewSession(device)).resolves.toEqual(success);
        expect(sent).toEqual(['ThpCreateNewSession', 'ButtonAck']);
    });

    it('rejects a response type the request does not expect', async () => {
        const { device } = createDevice([{ type: 'ThpEndResponse', message: {} }]);

        await expect(createNewSession(device)).rejects.toMatchObject({
            code: 'Runtime',
        });
    });

    it('rejects a response type the request does not expect after a ButtonRequest', async () => {
        const { device } = createDevice([buttonRequest, { type: 'ThpEndResponse', message: {} }]);

        await expect(createNewSession(device)).rejects.toMatchObject({
            code: 'Runtime',
        });
    });
});
