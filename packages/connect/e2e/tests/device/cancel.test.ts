import { StartEmu, SetupEmu } from '@trezor/trezor-user-env-link';
import { getController, initTrezorConnect } from '../../common.setup';
import TrezorConnect from '../../../src';

const getAddress = (showOnTrezor: boolean, coin: string = 'regtest') => {
    return TrezorConnect.getAddress({
        path: "m/84'/1'/0'/0/0",
        coin,
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
    const getAddressResponse = await getAddress(false, 'testnet');
    expect(getAddressResponse).toMatchObject({
        success: true,
        payload: { address: 'tb1qnspxpr2xj9s2jt6qlhuvdnxw6q55jvygcf89r2' },
    });
};

describe('TrezorConnect.cancel', () => {
    const controller = getController();

    const setupTest = async ({
        setupParams,
        bridgeVersion,
    }: {
        setupParams: SetupEmu & StartEmu;
        bridgeVersion: string;
    }) => {
        await controller.stopBridge();
        await controller.stopEmu();
        await controller.startEmu({ wipe: true, ...setupParams });
        await controller.setupEmu(setupParams);
        await controller.startBridge(bridgeVersion);

        await initTrezorConnect(controller, { debug: true });
    };

    beforeAll(async () => {
        await controller.connect();
    });

    afterAll(async () => {
        await TrezorConnect.dispose();
        controller.dispose();
    });

    [
        // '2.0.27', // todo: 2.0.27 is removed from trezor-user-env
        '2.0.33',
        // '3.0.0' // todo: add support in trezor-user-env
    ].forEach(bridgeVersion => {
        describe(`Bridge ${bridgeVersion}`, () => {
            afterEach(async () => {
                await TrezorConnect.dispose();
                await controller.stopEmu();
                await controller.stopBridge();
            });

            // the goal is to run this test couple of times to uncover possible race conditions/flakiness
            it(`GetAddress - ButtonRequest_Address - Cancel `, async () => {
                await setupTest({
                    setupParams: {},
                    bridgeVersion,
                });

                TrezorConnect.removeAllListeners();
                const getAddressCall = getAddress(true);
                await new Promise<void>(resolve => {
                    TrezorConnect.on('button', event => {
                        if (event.code === 'ButtonRequest_Address') {
                            resolve();
                        }
                    });
                });

                TrezorConnect.cancel('Cancel reason');

                const response = await getAddressCall;

                expect(response).toMatchObject({
                    success: false,
                    payload: {
                        error: 'Cancel reason',
                        code: 'Method_Cancel',
                    },
                });

                // TODO: here I would like to continue and validate that I can communicate after a cancelled call
                // await assertGetAddressWorks();

                // but this sometimes fails (nodejs) with, probably a race condition
                //   success: false,
                //   payload: {
                //     error: 'Initialize failed: Unexpected message, code: Failure_UnexpectedMessage',
                //     code: 'Device_InitializeFailed'
                //   }
            });

            it('Synchronous Cancel', async () => {
                await setupTest({
                    setupParams: {},
                    bridgeVersion,
                });

                TrezorConnect.removeAllListeners();
                const getAddressCall = getAddress(true);

                // almost synchronous, TODO: core methodSynchronize race-condition in nodejs (works in web)
                await new Promise(resolve => setTimeout(resolve, 1));

                TrezorConnect.cancel('Cancel reason');

                const response = await getAddressCall;

                expect(response).toMatchObject({
                    success: false,
                    payload: {
                        error: 'Cancel reason',
                    },
                });

                // todo: this test doesn't work properly
                // getAddressCall is rejected while device is acquiring workflow continues...
                // assertion will result with "device call in progress"
                // await assertGetAddressWorks();
            });

            it('Passphrase request - Cancel', async () => {
                await setupTest({
                    setupParams: {
                        passphrase_protection: true,
                    },
                    bridgeVersion,
                });

                const getAddressCall = getAddress(true);
                await new Promise<void>(resolve => {
                    TrezorConnect.on('ui-request_passphrase', () => resolve());
                });
                TrezorConnect.cancel();

                const response = await getAddressCall;

                expect(response.success).toEqual(false);

                await assertGetAddressWorks();
            });

            // todo: this should be conditionalTest(['2'])
            it('Pin request - Cancel', async () => {
                await setupTest({
                    setupParams: {
                        version: '1-latest',
                        model: 'T1B1',
                        pin: '1234',
                    },
                    bridgeVersion,
                });
                // T1 needs to be restarted for settings to be applied (pin)
                await controller.stopEmu();
                await controller.startEmu({ version: '1-latest', model: 'T1B1' });

                const pinPromise = new Promise<void>(resolve => {
                    TrezorConnect.on('ui-request_pin', () => {
                        resolve();
                    });
                });
                const getAddressCall = getAddress(true);
                await pinPromise;
                TrezorConnect.cancel();

                const response = await getAddressCall;

                expect(response.success).toEqual(false);

                // assertGetAddressWorks will not work without providing pin
                const feat = await TrezorConnect.getFeatures();
                expect(feat.payload).toMatchObject({ initialized: true });
            });

            // todo: this should be conditionalTest(['2'])
            it('Word request - Cancel', async () => {
                await controller.startEmu({ version: '1-latest', model: 'T1B1', wipe: true });
                await controller.startBridge(bridgeVersion);
                await initTrezorConnect(controller);

                const wordPromise = new Promise<void>(resolve => {
                    TrezorConnect.on('ui-request_word', () => resolve());
                });
                const recoveryDeviceCall = TrezorConnect.recoveryDevice({
                    passphrase_protection: false,
                    pin_protection: false,
                });

                await wordPromise;
                TrezorConnect.cancel();

                const response = await recoveryDeviceCall;

                expect(response.success).toEqual(false);

                // assertGetAddressWorks will not work here, device is not initialized
                const feat = await TrezorConnect.getFeatures();
                expect(feat.payload).toMatchObject({ initialized: false });
            });
        });
    });
});
