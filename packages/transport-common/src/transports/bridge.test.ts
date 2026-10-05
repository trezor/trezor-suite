import { thp as protocolThp, v2 as protocolV2 } from '@trezor/protocol';

import { BridgeTransport } from './bridge';
import { HTTP_ERROR } from '../errors';
import { Session } from '../types';
import { bridgeApiCall } from '../utils/bridgeApiCall';

jest.mock('../utils/bridgeApiCall');

describe('BridgeTransport', () => {
    it('sends only the THP channel state in a call body', async () => {
        jest.mocked(bridgeApiCall).mockResolvedValue({
            success: false,
            error: { code: HTTP_ERROR },
        });
        const thpState = new protocolThp.ThpState();
        thpState.setChannel(Buffer.from('1234', 'hex'));
        thpState.setThpProperties({
            internal_model: 'T3W1',
            model_variant: 0,
            protocol_version_major: 2,
            protocol_version_minor: 0,
            pairing_methods: [],
        });
        thpState.setPairingCredentials([
            {
                trezor_static_public_key: 'aa',
                credential: 'bb',
                host_static_key: 'cc',
                autoconnect: false,
            },
        ]);

        await new BridgeTransport({ id: 'test' }).call({
            session: Session('1'),
            name: 'ThpHandshakeInitRequest',
            data: { key: Buffer.alloc(32), tryToUnlock: 0 },
            protocol: protocolV2,
            thpState,
        });

        const body = jest.mocked(bridgeApiCall).mock.lastCall?.[0].body;
        const { thpState: sentState } = JSON.parse(String(body));
        expect(sentState).toMatchObject({ channel: '1234' });
        expect(sentState).not.toHaveProperty('properties');
        expect(sentState).not.toHaveProperty('credentials');
        expect(() => new protocolThp.ThpState().deserialize(sentState)).not.toThrow();
    });
});
