/* eslint-disable import/no-named-as-default */

import TrezorConnect from '../../../src';

const { getController, setup, initTrezorConnect } = global.Trezor;

const controller = getController('cancel');

describe('TrezorConnect cancel', () => {
    beforeAll(async () => {
        await setup(controller, { mnemonic: 'mnemonic_all' });
        await initTrezorConnect(controller);
        TrezorConnect.removeAllListeners();
    });

    afterAll(async () => {
        controller.dispose();
        await TrezorConnect.dispose();
    });

    it(`TrezorConnect.getAddrqess() -> TrezorConnect.cancel('cancelled')`, async () => {
        if (typeof expect.assertions === 'function') {
            expect.assertions(1);
        }

        TrezorConnect.getAddress({
            path: "m/44'/1'/0'/0/0",
        }).then(response => {
            expect(response).toMatchObject({
                success: false,
                payload: { code: 'Method_Cancel', error: 'Meow from trezor-connect' },
            });
        });

        await new Promise(resolve => {
            TrezorConnect.on('button', event => {
                if (event.code === 'ButtonRequest_Address') {
                    TrezorConnect.cancel('Meow from trezor-connect');
                }
                resolve(undefined);
            });
        });

        await new Promise(resolve => {
            setTimeout(() => {
                resolve(undefined);
            }, 2000);
        });
        // const res = await TrezorConnect.getPublicKey({
        //     path: "m/44'/1'/0'/0/0",
        // });
        // console.log('---res', res);
        // expect(res).toMatchObject({ success: true });
    });
});
