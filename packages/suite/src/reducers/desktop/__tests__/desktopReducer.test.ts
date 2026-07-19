import type { HandshakeElectron } from '@trezor/suite-desktop-api';

import { desktopHandshake } from 'src/actions/suite/suiteActions';

import { desktopReducer } from '../index';

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
        expect(desktopReducer(null, desktopHandshake(handshakePayload))).toEqual(handshakePayload);
    });
});
