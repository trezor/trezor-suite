/* eslint-disable import/no-named-as-default, no-restricted-syntax */

import TrezorConnect from '../../../src';

const { getController, setup, initTrezorConnect } = global.Trezor;

const controller = getController('setBusy');

describe('TrezorConnect override param', () => {
    beforeAll(async () => {
        await setup(controller, { mnemonic: 'mnemonic_all' });
        await initTrezorConnect(controller);
        TrezorConnect.removeAllListeners();
    });

    afterAll(async () => {
        controller.dispose();
        await TrezorConnect.dispose();
    });

    // test override for couple of delays to simulate what happens if:
    // - TrezorConnet.method() -> acquire -> override
    // - TrezorConnet.method() -> acquire -> initialize -> override
    // - TrezorConnet.method() -> acquire -> initialize -> call -> override
    // this test is intentionally not waiting for button request to send the subsequent (overriding) request. side note: cancel test does this.
    // this tests tries to prove that it is possible to override request at any point of time.
    for (const delay of [1, 10, 100, 1000, 1500, 3000]) {
        it(`override previous call after ms ${delay} delay`, async () => {
            TrezorConnect.getAddress({
                path: "m/44'/1'/0'/0/0",
                showOnTrezor: true,
            }).then(response => {
                expect(response).toMatchObject({
                    success: false,
                    payload: { code: 'Method_Override' },
                });
            });

            await new Promise(resolve => {
                setTimeout(async () => {
                    const address = await TrezorConnect.getAddress({
                        path: "m/44'/1'/0'/0/1",
                        showOnTrezor: false,
                        override: true,
                    });
                    resolve(undefined);
                    expect(address.success).toEqual(true);
                }, delay);
            });

            await new Promise(resolve => {
                setTimeout(() => {
                    resolve(undefined);
                }, 500);
            });
        });
    }
});
