import TrezorConnect from '../../../src';

const { getController, setup, conditionalTest, initTrezorConnect } = global.Trezor;
const { ADDRESS_N } = global.TestUtils;

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

    afterAll(async () => {
        controller.dispose();
        await TrezorConnect.dispose();
    });

    // firmware after passphrase redesign
    conditionalTest(
        ['<1.9.0', '<2.3.0'],
        'Using multiple passphrases at the same time',
        async () => {
            const XPUB_PATH = ADDRESS_N("m/84'/0'/0'");
            const ADDRESS_PATH = ADDRESS_N("m/84'/0'/0'/0/0");
            // get state of default wallet with empty passphrase
            const walletDefault = await TrezorConnect.getDeviceState({
                device: {
                    instance: 0,
                    state: undefined, // reset state from previous tests on this instance
                },
                useEmptyPassphrase: true,
            });
            if (!walletDefault.success) {
                throw new Error(`default Wallet exception: ${walletDefault.payload.error}`);
            }
            const xpub = await TrezorConnect.getPublicKey({
                device: {
                    instance: 0,
                },
                useEmptyPassphrase: true,
                path: XPUB_PATH,
            });
            expect(xpub.payload).toMatchObject({
                xpub: 'xpub6DDUPHpUo4pcy43iJeZjbSVWGav1SMMmuWdMHiGtkK8rhKmfbomtkwW6GKs1GGAKehT6QRocrmda3WWxXawpjmwaUHfFRXuKrXSapdckEYF',
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
                throw new Error(`Wallet A exception: ${walletA.payload.error}`);
            }
            const xpubA = await TrezorConnect.getPublicKey({
                device: {
                    instance: 1,
                    state: walletA.payload.state,
                },
                path: XPUB_PATH,
            });
            expect(xpubA.payload).toMatchObject({
                xpub: 'xpub6CixwCVCacLWy2pdyzvcWATbm8cHRqLkmC3B335NzEVx3DBMG8mhoqyJzm62Qkv3UyN4haP7xnihe7ZR134vVGY8pjAHtGgiyD139Ro29N8',
            });

            // get state of walletB using passphrase "b"
            TrezorConnect.on('ui-request_passphrase', passphraseHandler('b'));
            const walletB = await TrezorConnect.getDeviceState({
                device: {
                    instance: 2,
                },
            });
            if (!walletB.success) {
                throw new Error(`Wallet B exception: ${walletB.payload.error}`);
            }
            const xpubB = await TrezorConnect.getPublicKey({
                device: {
                    instance: 2,
                    state: walletB.payload.state,
                },
                path: XPUB_PATH,
            });
            expect(xpubB.payload).toMatchObject({
                xpub: 'xpub6CUsAXLNQXX9oGjwXi2EjL1Hp8BMPSKXsgdRHv5pgPoqb9CxncThcup7YAsbYcKMgRqDbedLCNUWzD7JhPVsEc82yYz15AYR35UGiUkXtWa',
            });

            // generate addresses from 3 different wallets in random order using same derivation path
            const addressA = await TrezorConnect.getAddress({
                device: {
                    instance: 1,
                    state: walletA.payload.state,
                },
                path: ADDRESS_PATH,
            });
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
            expect(address.payload).toMatchObject({
                address: 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
            });

            // use invalid state on default instance
            const invalidState = await TrezorConnect.getAddress({
                device: {
                    instance: 0,
                    state: walletA.payload.state, // NOTE: state from different wallet/instance
                },
                path: ADDRESS_N("m/84'/0'/0'/0/0"),
                showOnTrezor: false,
            });
            expect(invalidState.payload).toMatchObject({
                error: 'Passphrase is incorrect',
            });
        },
    );

    // passphrase on device not available on T1B1
    conditionalTest(['1', '<2.3.0'], 'Input passphrase on device', async () => {
        TrezorConnect.on('ui-request_passphrase', () => {
            TrezorConnect.uiResponse({
                type: 'ui-receive_passphrase',
                payload: {
                    passphraseOnDevice: true,
                    value: '',
                },
            });
            TrezorConnect.removeAllListeners('ui-request_passphrase');
            controller.send({ type: 'emulator-input', value: 'a' });
        });
        const walletA = await TrezorConnect.getDeviceState({
            device: {
                instance: 0,
                state: undefined, // reset state from previous tests on this instance
            },
        });
        if (!walletA.success) {
            throw new Error(`Wallet A exception: ${walletA.payload.error}`);
        }
        const xpubA = await TrezorConnect.getPublicKey({
            device: {
                instance: 0,
                state: walletA.payload.state,
            },
            path: ADDRESS_N("m/84'/0'/0'"),
        });
        // same xpub as walletA from previous test case enforced on instance 0
        expect(xpubA.payload).toMatchObject({
            xpub: 'xpub6CixwCVCacLWy2pdyzvcWATbm8cHRqLkmC3B335NzEVx3DBMG8mhoqyJzm62Qkv3UyN4haP7xnihe7ZR134vVGY8pjAHtGgiyD139Ro29N8',
        });
    });

    // legacy firmware before passphrase redesing
    // FW didn't have multiple slots at that time, therefore passphrase was requested each time it was changed
    conditionalTest(['>1.8.0', '>2.2.0'], 'Legacy passphrase flow', async () => {
        const XPUB_PATH = ADDRESS_N("m/84'/0'/0'");
        const ADDRESS_PATH = ADDRESS_N("m/84'/0'/0'/0/0");
        const legacyPassphraseSourceHandler = ({ code }: any) => {
            if (code === 'ButtonRequest_PassphraseType') {
                controller.send({ type: 'emulator-click', x: 120, y: 180 });
                TrezorConnect.off('ui-button', legacyPassphraseSourceHandler);
            }
        };

        const walletDefault = await TrezorConnect.getDeviceState({
            device: {
                instance: 0,
            },
            useEmptyPassphrase: true,
        });
        if (!walletDefault.success) {
            throw new Error(`default Wallet exception: ${walletDefault.payload.error}`);
        }
        const xpub = await TrezorConnect.getPublicKey({
            device: {
                instance: 0,
            },
            useEmptyPassphrase: true,
            path: XPUB_PATH,
        });
        expect(xpub.payload).toMatchObject({
            xpub: 'xpub6DDUPHpUo4pcy43iJeZjbSVWGav1SMMmuWdMHiGtkK8rhKmfbomtkwW6GKs1GGAKehT6QRocrmda3WWxXawpjmwaUHfFRXuKrXSapdckEYF',
        });

        TrezorConnect.on('ui-button', legacyPassphraseSourceHandler);
        TrezorConnect.on('ui-request_passphrase', passphraseHandler('a'));
        const walletA = await TrezorConnect.getDeviceState({
            device: {
                instance: 1,
                state: undefined, // restet state from previous tests on instance 0
            },
        });
        if (!walletA.success) {
            throw new Error(`Wallet A exception: ${walletA.payload.error}`);
        }
        const xpubA = await TrezorConnect.getPublicKey({
            device: {
                instance: 1,
                state: walletA.payload.state,
            },
            path: XPUB_PATH,
        });
        expect(xpubA.payload).toMatchObject({
            xpub: 'xpub6CixwCVCacLWy2pdyzvcWATbm8cHRqLkmC3B335NzEVx3DBMG8mhoqyJzm62Qkv3UyN4haP7xnihe7ZR134vVGY8pjAHtGgiyD139Ro29N8',
        });

        TrezorConnect.on('ui-button', legacyPassphraseSourceHandler);
        TrezorConnect.on('ui-request_passphrase', passphraseHandler('b'));
        const walletB = await TrezorConnect.getDeviceState({
            device: {
                instance: 2,
            },
        });
        if (!walletB.success) {
            throw new Error(`Wallet B exception: ${walletB.payload.error}`);
        }
        const xpubB = await TrezorConnect.getPublicKey({
            device: {
                instance: 2,
                state: walletB.payload.state,
            },
            path: XPUB_PATH,
        });
        expect(xpubB.payload).toMatchObject({
            xpub: 'xpub6CUsAXLNQXX9oGjwXi2EjL1Hp8BMPSKXsgdRHv5pgPoqb9CxncThcup7YAsbYcKMgRqDbedLCNUWzD7JhPVsEc82yYz15AYR35UGiUkXtWa',
        });

        // NOTE: switching back to wallet A will trigger passphrase request again
        TrezorConnect.on('ui-button', legacyPassphraseSourceHandler);
        TrezorConnect.on('ui-request_passphrase', passphraseHandler('a'));
        const addressA = await TrezorConnect.getAddress({
            device: {
                instance: 1,
                state: walletA.payload.state,
            },
            path: ADDRESS_PATH,
        });
        expect(addressA.payload).toMatchObject({
            address: 'bc1qjgjmd5mg4acxghjcmflpvh44dfxdwnespafrd3',
        });

        // use invalid state/passphrase (passphrase "b" on walletA)
        TrezorConnect.on('ui-button', legacyPassphraseSourceHandler);
        TrezorConnect.on('ui-request_passphrase', passphraseHandler('b'));
        const invalidState = await TrezorConnect.getAddress({
            device: {
                instance: 1,
                state: walletB.payload.state, // NOTE: state from different wallet/instance
            },
            path: ADDRESS_PATH,
            showOnTrezor: false,
        });
        expect(invalidState.payload).toMatchObject({
            error: 'Passphrase is incorrect',
        });
    });
});
