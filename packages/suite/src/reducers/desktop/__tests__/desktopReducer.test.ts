import { desktopReducer } from '..';
import * as SUITE from 'src/actions/suite/constants/suiteConstants';
import type { HandshakeElectron } from '@trezor/suite-desktop-api';

const handshakePayload: HandshakeElectron = {
    paths: {
        binDir: 'a',
        userDir: 'b',
    },
    urls: {
        httpReceiver: 'c',
    },
};

describe('desktop reducer', () => {
    it('SUITE.DESKTOP_HANDSHAKE', () => {
        expect(
            desktopReducer(null, { type: SUITE.DESKTOP_HANDSHAKE, payload: handshakePayload }),
        ).toEqual(handshakePayload);
    });
});
