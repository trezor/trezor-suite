import { conditionalTest, initTrezorConnect, getController, setup } from '../../common.setup';
import TrezorConnect from '../../../src';

const getAddress = (showOnTrezor: boolean, coin: string = 'regtest') =>
    TrezorConnect.getAddress({
        path: "m/84'/1'/0'/0/0",
        coin,
        showOnTrezor,
    });

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
        payload: { address: 'tb1qkvwu9g3k2pdxewfqr7syz89r3gj557l3uuf9r9' },
    });
};

describe('TrezorConnect.cancel', () => {
    const controller = getController();

    beforeAll(async () => {
        await controller.connect();
    });

    afterAll(() => {
        TrezorConnect.dispose();
        controller.dispose();
    });

    beforeEach(() => {
        TrezorConnect.dispose();
    });

    afterEach(async () => {
        TrezorConnect.dispose();
        await controller.stopEmu();
        await controller.stopBridge();
    });

    // the goal is to run this test couple of times to uncover possible race conditions/flakiness
    it(`GetAddress - ButtonRequest_Address - Cancel `, async () => {
        await setup(controller, {
            mnemonic: 'mnemonic_all',
            passphrase_protection: false,
        });
        await initTrezorConnect(controller);

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
        await setup(controller, {
            mnemonic: 'mnemonic_all',
            passphrase_protection: false,
        });

        await initTrezorConnect(controller);
        TrezorConnect.removeAllListeners();
        const getAddressCall = getAddress(true);

        // almost synchronous, TODO: core methodSynchronize race-condition in nodejs (works in web)
        // TODO: model T is happy with 1ms, model one needs more (1000 worked)
        await new Promise(resolve => setTimeout(resolve, 1000));

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
        await setup(controller, {
            mnemonic: 'mnemonic_all',
            passphrase_protection: true,
        });
        await initTrezorConnect(controller);

        const getAddressCall = getAddress(true);
        await new Promise<void>(resolve => {
            TrezorConnect.on('ui-request_passphrase', () => resolve());
        });
        TrezorConnect.cancel();

        const response = await getAddressCall;

        expect(response.success).toEqual(false);

        await assertGetAddressWorks();
    });

    conditionalTest(['2'], 'Pin request - Cancel', async () => {
        await controller.stopBridge();
        await controller.stopEmu();
        await controller.startEmu({
            wipe: true,
            version: '1-latest',
            model: 'T1B1',
        });
        await controller.setupEmu({
            pin: '1234',
        });
        await controller.startBridge(
            // @ts-expect-error
            process.env.TESTS_TRANSPORT,
        );

        // T1 needs to be restarted for settings to be applied (pin)
        await controller.stopEmu();
        await controller.startEmu({ version: '1-latest', model: 'T1B1' });

        await initTrezorConnect(controller);

        // TODO: race condition. On my machine it doesn't work without this delay
        // reproducible by commenting out this line and
        // ./docker/docker-connect-test.sh node -p cancel.test -f 1-main -d -m T1B1
        await new Promise(resolve => setTimeout(resolve, 1000));

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

    conditionalTest(['2'], 'Word request - Cancel', async () => {
        await controller.stopBridge();
        await controller.stopEmu();
        await controller.startEmu({
            wipe: true,
            version: '1-latest',
            model: 'T1B1',
        });
        await controller.startBridge(
            // @ts-expect-error
            process.env.TESTS_TRANSPORT,
        );
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
