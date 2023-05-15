/* eslint-disable import/no-named-as-default */

import TrezorConnect from '../../../src';

const { getController, setup, initTrezorConnect } = global.Trezor;

const controller = getController('setBusy');

describe('TrezorConnect cancel', () => {
    beforeAll(async () => {
        await setup(controller, { mnemonic: 'mnemonic_all' });
        await initTrezorConnect(controller);
    });

    afterAll(async () => {
        controller.dispose();
        await TrezorConnect.dispose();
    });

    it(`TrezorConnect.getAddress() -> TrezorConnect.cancel()`, async () => {
        TrezorConnect.getAddress({
            path: "m/44'/1'/0'/0/0",
        }).then(response => {
            expect(response).toEqual({ code: 'Method_Cancel', error: 'Meow from trezor-connect' });
        });

        await new Promise(resolve => {
            TrezorConnect.on('button', event => {
                if (event.code === 'ButtonRequest_Address') {
                    TrezorConnect.cancel('Meow from trezor-connect');
                }
                resolve(undefined);
            });
        });
    });
});
