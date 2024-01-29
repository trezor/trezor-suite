/* eslint-disable import/no-named-as-default, no-restricted-syntax */

import TrezorConnect from '../../../src';

const { getController, setup, initTrezorConnect } = global.Trezor;

const controller = getController('setBusy');

describe('TrezorConnect override param', () => {
    beforeEach(async () => {
        await TrezorConnect.dispose();
        await setup(controller, {
            mnemonic: 'mnemonic_all',
        });
        await initTrezorConnect(controller);
    });

    afterAll(async () => {
        controller.dispose();
        await TrezorConnect.dispose();
    });

    for (const delay of [1, 10, 100, 300, 500, 1000, 1500]) {
        it(`override previous call after ${delay}ms`, async () => {
            TrezorConnect.removeAllListeners();

            TrezorConnect.getAddress({
                path: "m/44'/1'/0'/0/0",
                showOnTrezor: true,
            }).then(response => {
                expect(response.success).toBe(false);
                expect(response.payload).toMatchObject({ code: 'Method_Override' });
            });

            await new Promise(resolve => {
                setTimeout(resolve, delay);
            });

            const address = await TrezorConnect.getAddress({
                path: "m/44'/1'/0'/0/0",
                override: true,
                showOnTrezor: false,
            });
            expect(address.success).toBe(true);
            await new Promise(resolve => {
                setTimeout(resolve, 1000);
            });
        });
    }
});
