import { SetupEmu } from '@trezor/trezor-user-env-link';
import TrezorConnect from '../../../src';

import { getController, setup, initTrezorConnect } from '../../common.setup';

const getAddress = (showOnTrezor: boolean) => {
    return TrezorConnect.getAddress({
        path: "m/44'/1'/0'/0/0",
        showOnTrezor,
    });
};

const passphraseHandler = (value: string) => () => {
    TrezorConnect.uiResponse({
        type: 'ui-receive_passphrase',
        payload: {
            passphraseOnDevice: false,
            value,
        },
    });
    TrezorConnect.removeAllListeners('ui-request_passphrase');
};

const addressHandler = () => () => {
    TrezorConnect.uiResponse({
        type: 'ui-receive_confirmation',
        payload: true,
    });
    TrezorConnect.removeAllListeners('ui-request_confirmation');
};

const assertGetAddressWorks = async () => {
    // validate that further communication is possible without any glitch
    TrezorConnect.on('ui-request_passphrase', passphraseHandler(''));
    TrezorConnect.on('ui-request_confirmation', addressHandler());
    TrezorConnect.on('ui-button', () => {
        setTimeout(() => getController().send({ type: 'emulator-press-yes' }), 1);
    });

    const getAddressResponse = await getAddress(false);
    expect(getAddressResponse).toMatchObject({
        payload: { address: expect.any(String) },
    });
};

describe('TrezorConnect.cancel', () => {
    const controller = getController();

    const setupTest = async ({ setupParams }: { setupParams: SetupEmu; bridgeVersion: string }) => {
        await setup(controller, setupParams);
        await TrezorConnect.dispose();
        await initTrezorConnect(controller, { debug: false });
    };

    afterAll(async () => {
        controller.dispose();
        await TrezorConnect.dispose();
    });

    [
        '2.0.27',
        '2.0.30',
        // todo: add support in trezor-user-env-link
        // '3.0.0'
    ].forEach(bridgeVersion => {
        describe(`Bridge ${bridgeVersion}`, () => {
            // the goal is to run this test couple of times to uncover possible race conditions/flakiness
            test(`GetAddress - ButtonRequest_Address - Cancel `, async () => {
                await setupTest({
                    setupParams: {
                        mnemonic: 'mnemonic_all',
                    },
                    bridgeVersion,
                });
                TrezorConnect.removeAllListeners();

                const getAddressCall = getAddress(true);
                await new Promise(resolve => {
                    TrezorConnect.on('button', event => {
                        if (event.code === 'ButtonRequest_Address') {
                            resolve(undefined);
                        }
                    });
                });

                TrezorConnect.cancel('my custom message');

                const response = await getAddressCall;

                expect(response).toMatchObject({
                    success: false,
                    payload: {
                        error: 'my custom message',
                        code: 'Method_Cancel',
                    },
                });

                // TODO: here I would like to continue and validate that I can communicate after a cancelled call

                // await assertGetAddressWorks();

                // but this sometimes fails with, probably a race condition
                //   success: false,
                //   payload: {
                //     error: 'Initialize failed: Unexpected message, code: Failure_UnexpectedMessage',
                //     code: 'Device_InitializeFailed'
                //   }
            });

            // TODO: this doesn't seem to work. I am not even sure if it should work but it would be nice if it did
            // await getAddressCal does not resolve
            test.skip('Synchronous Cancel', async () => {
                await setupTest({
                    setupParams: {
                        mnemonic: 'mnemonic_all',
                    },
                    bridgeVersion,
                });
                TrezorConnect.removeAllListeners();

                const getAddressCall = getAddress(true);

                TrezorConnect.cancel();

                const response = await getAddressCall;
                expect(response.success).toEqual(false);
            });

            test('Passphrase request - Cancel', async () => {
                await setupTest({
                    setupParams: {
                        mnemonic: 'mnemonic_all',
                        passphrase_protection: true,
                    },
                    bridgeVersion,
                });
                TrezorConnect.removeAllListeners();

                const getAddressCall = getAddress(true);
                await new Promise(resolve => {
                    TrezorConnect.on('UI_EVENT', event => {
                        if (event.type === 'ui-request_passphrase') {
                            resolve(undefined);
                        }
                    });
                });
                TrezorConnect.cancel();

                const response = await getAddressCall;

                expect(response.success).toEqual(false);

                await assertGetAddressWorks();
            });
        });
    });
});
