// eslint-disable-next-line import/no-extraneous-dependencies
import TrezorConnect from '@trezor/connect';

import {
    conditionalTest,
    getController,
    initTrezorConnect,
    restartEmu,
    setup,
} from '../../common.setup';

const controller = getController();

const passphraseHandler = (value: string) => () => {
    TrezorConnect.uiResponse({
        type: 'ui-receive_passphrase',
        payload: {
            passphraseOnDevice: false,
            value,
            save: true, // NOTE: this field is used only in legacy test of T1B1 firmware
        },
    });
    TrezorConnect.removeAllListeners('ui-request_passphrase');
};

describe('TrezorConnect passphrase', () => {
    beforeAll(async () => {
        await setup(controller, {
            mnemonic: 'mnemonic_all',
            passphrase_protection: true,
        });
        await initTrezorConnect(controller, { debug: false });
    });

    afterAll(() => {
        controller.dispose();
        TrezorConnect.dispose();
    });

    it('Using multiple passphrases at the same time', async () => {
        const XPUB_PATH = "m/84'/0'/0'";
        const ADDRESS_PATH = "m/84'/0'/0'/0/0";
        // get state of default wallet with empty passphrase
        const walletDefault = await TrezorConnect.getDeviceState({
            device: {
                instance: 0,
                state: undefined, // reset state from previous tests on this instance
                useEmptyPassphrase: true,
            },
        });
        if (!walletDefault.success) {
            throw new Error(`default Wallet exception: ${walletDefault.error.message}`);
        }
        const xpub = await TrezorConnect.getPublicKey({
            device: { instance: 0, useEmptyPassphrase: true },
            path: XPUB_PATH,
        });
        if (!xpub.success) {
            throw new Error(`getPublicKey exception: ${xpub.error.message}`);
        }
        expect(xpub.payload).toMatchObject({
            xpub: 'xpub6DDUPHpUo4pcy43iJeZjbSVWGav1SMMmuWdMHiGtkK8rhKmfbomtkwW6GKs1GGAKehT6QRocrmda3WWxXawpjmwaUHfFRXuKrXSapdckEYF',
        });
        expect(xpub.device).toMatchObject({
            instance: 0,
            state: walletDefault.payload.state,
        });

        // get state of walletA using passphrase "a"
        TrezorConnect.on('ui-request_passphrase', passphraseHandler('a'));
        const walletA = await TrezorConnect.getDeviceState({
            device: {
                instance: 1,
                state: undefined, // reset state from previous tests on this instance
            },
        });
        if (!walletA.success) {
            throw new Error(`Wallet A exception: ${walletA.error.message}`);
        }
        const xpubA = await TrezorConnect.getPublicKey({
            device: {
                instance: 1,
                state: walletA.payload.state,
            },
            path: XPUB_PATH,
        });
        if (!xpubA.success) {
            throw new Error(`getPublicKey A exception: ${xpubA.error.message}`);
        }
        expect(xpubA.payload).toMatchObject({
            xpub: 'xpub6CixwCVCacLWy2pdyzvcWATbm8cHRqLkmC3B335NzEVx3DBMG8mhoqyJzm62Qkv3UyN4haP7xnihe7ZR134vVGY8pjAHtGgiyD139Ro29N8',
        });
        expect(xpubA.device).toMatchObject({
            instance: 1,
            state: walletA.payload.state,
        });

        // get state of walletB using passphrase "b"
        TrezorConnect.on('ui-request_passphrase', passphraseHandler('b'));
        const walletB = await TrezorConnect.getDeviceState({
            device: {
                instance: 2,
            },
        });
        if (!walletB.success) {
            throw new Error(`Wallet B exception: ${walletB.error.message}`);
        }
        const xpubB = await TrezorConnect.getPublicKey({
            device: {
                instance: 2,
                state: walletB.payload.state,
            },
            path: XPUB_PATH,
        });
        if (!xpubB.success) {
            throw new Error(`getPublicKey B exception: ${xpubB.error.message}`);
        }
        expect(xpubB.payload).toMatchObject({
            xpub: 'xpub6CUsAXLNQXX9oGjwXi2EjL1Hp8BMPSKXsgdRHv5pgPoqb9CxncThcup7YAsbYcKMgRqDbedLCNUWzD7JhPVsEc82yYz15AYR35UGiUkXtWa',
        });
        expect(xpubB.device).toMatchObject({
            instance: 2,
            state: walletB.payload.state,
        });

        // generate addresses from 3 different wallets in random order using same derivation path
        const addressA = await TrezorConnect.getAddress({
            device: {
                instance: 1,
                state: walletA.payload.state,
            },
            path: ADDRESS_PATH,
        });
        if (!addressA.success) throw new Error(addressA.error.message);
        expect(addressA.payload).toMatchObject({
            address: 'bc1qjgjmd5mg4acxghjcmflpvh44dfxdwnespafrd3',
        });
        const addressB = await TrezorConnect.getAddress({
            device: {
                instance: 2,
                state: walletB.payload.state,
            },
            path: ADDRESS_PATH,
        });
        if (!addressB.success) throw new Error(addressB.error.message);
        expect(addressB.payload).toMatchObject({
            address: 'bc1qrfe6tkm77tgg03xzgvnjf9mgrr7sfez2gk2h47',
        });
        const address = await TrezorConnect.getAddress({
            device: {
                instance: 0,
                state: walletDefault.payload.state,
            },
            path: ADDRESS_PATH,
            showOnTrezor: false,
        });
        if (!address.success) throw new Error(address.error.message);
        expect(address.payload).toMatchObject({
            address: 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
        });

        // use invalid state on default instance
        TrezorConnect.on('ui-request_passphrase', passphraseHandler('wrong'));
        const invalidState = await TrezorConnect.getAddress({
            device: {
                instance: 0,
                state: {
                    staticSessionId: walletA.payload.state.staticSessionId, // NOTE: state from different wallet/instance
                },
            },
            path: "m/84'/0'/0'/0/0",
            showOnTrezor: false,
        });
        if (invalidState.success) {
            throw new Error('Expected to fail');
        }
        expect(invalidState.error).toMatchObject({
            code: 'Device_InvalidState',
            message: 'Passphrase is incorrect',
        });
        TrezorConnect.removeAllListeners('ui-request_passphrase');
    });

    it('Using multiple passphrases with device restart', async () => {
        // get standard wallet state
        const standard = await TrezorConnect.getDeviceState({
            device: { instance: 0, state: undefined, useEmptyPassphrase: true },
        });
        if (!standard.success) throw new Error(standard.error.message);

        // get passphrase wallet state
        TrezorConnect.on('ui-request_passphrase', passphraseHandler('a'));
        const passphrase = await TrezorConnect.getDeviceState({
            device: { instance: 1, state: undefined },
        });
        if (!passphrase.success) throw new Error(passphrase.error.message);

        // restart the device
        await restartEmu(controller);

        // try to get passphrase wallet state, with now invalid sessionId
        TrezorConnect.on('ui-request_passphrase', passphraseHandler('a'));
        const passphrase2 = await TrezorConnect.getDeviceState({
            device: {
                instance: 1,
                state: { staticSessionId: passphrase.payload.state.staticSessionId },
            },
        });
        if (!passphrase2.success) throw new Error(passphrase2.error.message);

        // try to get standard wallet state, with sessionId now used for passphrase wallet
        const standard2 = await TrezorConnect.getDeviceState({
            device: {
                instance: 0,
                state: {
                    staticSessionId: standard.payload.state.staticSessionId,
                },
                useEmptyPassphrase: true,
            },
        });
        if (!standard2.success) throw new Error(standard2.error.message);

        expect(passphrase2.payload.state.staticSessionId).toEqual(
            passphrase.payload.state.staticSessionId,
        );
        expect(standard2.payload.state.staticSessionId).toEqual(
            standard.payload.state.staticSessionId,
        );
    });

    it('Passphrase encoding', async () => {
        TrezorConnect.on('ui-request_passphrase', passphraseHandler('příliš žluťoučký kůň'));

        const xpub = await TrezorConnect.getPublicKey({
            device: {
                instance: 0,
                state: undefined,
            },
            path: "m/84'/0'/0'/0/0",
        });

        if (!xpub.success) {
            throw new Error(`Passphrase exception: ${xpub.error.message}`);
        }
        expect(xpub.payload).toMatchObject({
            xpub: 'xpub6Gw8xpZ3YUTF7ebfnT3bGLHYrZ5mRQU14SXfGsjopTx1yVcZwkXSz2TPGyS7zqvzL9McXUjBG87FugyENjxpFCCv5W3ic1SWW5oQbRKx368',
        });
    });

    // passphrase on device not available on T1B1
    conditionalTest(['1'], 'Input passphrase on device', async () => {
        TrezorConnect.on('ui-request_passphrase', () => {
            TrezorConnect.uiResponse({
                type: 'ui-receive_passphrase',
                payload: {
                    passphraseOnDevice: true,
                    value: '',
                },
            });
            TrezorConnect.removeAllListeners('ui-request_passphrase');
            // Due to race condition with node-bridge, we have to wait a bit
            setTimeout(() => {
                controller.send({ type: 'emulator-input', value: 'a' });
            }, 50);
        });
        const walletA = await TrezorConnect.getDeviceState({
            device: {
                instance: 0,
                state: undefined, // reset state from previous tests on this instance
            },
        });
        if (!walletA.success) {
            throw new Error(`Wallet A exception: ${walletA.error.message}`);
        }
        const xpubA = await TrezorConnect.getPublicKey({
            device: {
                instance: 0,
                state: walletA.payload.state,
            },
            path: "m/84'/0'/0'",
        });
        // same xpub as walletA from previous test case enforced on instance 0
        if (!xpubA.success) {
            throw new Error(`getPublicKey A exception: ${xpubA.error.message}`);
        }
        expect(xpubA.payload).toMatchObject({
            xpub: 'xpub6CixwCVCacLWy2pdyzvcWATbm8cHRqLkmC3B335NzEVx3DBMG8mhoqyJzm62Qkv3UyN4haP7xnihe7ZR134vVGY8pjAHtGgiyD139Ro29N8',
        });
    });
});
