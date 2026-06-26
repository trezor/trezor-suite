// eslint-disable-next-line import/no-extraneous-dependencies
import TrezorConnect, { connectCallableMethods } from '@trezor/connect';

import { getController, initTrezorConnect, setup } from '../../common.setup';
const controller = getController();

describe('__info common param', () => {
    beforeAll(async () => {
        TrezorConnect.dispose();
        await setup(controller, {
            mnemonic: 'mnemonic_all',
            passphrase_protection: false,
        });
        await initTrezorConnect(controller);
    });

    afterAll(() => {
        controller.dispose();
        TrezorConnect.dispose();
    });

    [true, false].forEach(__info => {
        it(`when incorrect params are passed, __info: boolean makes no difference. case: ${__info}`, async () => {
            // @ts-expect-error
            const result = await TrezorConnect.getAddress({
                __info,
            });

            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            if (result.success) throw new Error('Expected failure');
            expect(result.error.message).toEqual(
                'Invalid parameter "bundle/0/path" (= undefined): Expected required property',
            );
        });
    });

    [true, false].forEach(__info => {
        it(`with correct params and __info: ${__info}`, async () => {
            const result = await TrezorConnect.getAddress({
                __info,
                path: "m/44'/1'/0'/0/0",
                showOnTrezor: false,
            });
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            if (!result.success) throw new Error(result.error.message);

            if (__info) {
                expect(result.payload).toMatchObject({
                    useDevice: true,
                });
            } else {
                expect(result.payload).toMatchObject({
                    address: expect.any(String),
                });
            }
        });
    });

    describe('all the non-utility methods should not crash', () => {
        connectCallableMethods.forEach(method => {
            it(`TrezorConnect.${method}({ __info: true })`, async () => {
                // @ts-expect-error
                const result = await TrezorConnect[method]({ __info: true });
                expect(result).toBeDefined();
            });
        });
    });
});
