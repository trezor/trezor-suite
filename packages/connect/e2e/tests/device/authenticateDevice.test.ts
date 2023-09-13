/* eslint-disable import/no-named-as-default */

import TrezorConnect from '../../../src';

const { getController, setup, initTrezorConnect } = global.Trezor;

const controller = getController();

describe('TrezorConnect.authenticateDevice', () => {
    beforeAll(async () => {
        await setup(controller, {
            mnemonic: 'mnemonic_all',
        });
        await initTrezorConnect(controller);
    });

    afterAll(async () => {
        controller.dispose();
        await TrezorConnect.dispose();
    });

    // NOTE: emulator uses different provisioning keys than production FW (different than ./data/deviceAuthenticityConfig)
    const config = {
        version: 1,
        timestamp: '2023-09-07T14:00:00+00:00',
        T2B1: {
            rootPubKeys: [
                '04626d58aca84f0fcb52ea63f0eb08de1067b8d406574a715d5e7928f4b67f113a00fb5c5918e74d2327311946c446b242c20fe7347482999bdc1e229b94e27d96',
            ],
            caPubKeys: [
                '049bf0760cd7555efc5b01e64ce94606cdeeb48a4f9196f454bc2a0141b331882d068b4b6e637913dd220654e28fde3c442141f953b3e36ad9a57519007119d9c9',
            ],
        },
    };

    it('validation successful', async () => {
        const result = await TrezorConnect.authenticateDevice({
            config,
        });

        if (result.success) {
            expect(result.payload.valid).toEqual(true);
        }
    });

    it('validation unsuccessful (rootPubKey not found)', async () => {
        const result = await TrezorConnect.authenticateDevice({
            config: {
                ...config,
                T2B1: {
                    ...config.T2B1,
                    rootPubKeys: [],
                },
            },
        });

        if (result.success) {
            expect(result.payload.valid).toEqual(false);
            expect(result.payload.error).toEqual('ROOT_PUBKEY_NOT_FOUND');
        }
    });

    it('sanity check unsuccessful (caPubkey not found)', async () => {
        const result = await TrezorConnect.authenticateDevice({
            config: {
                ...config,
                T2B1: {
                    ...config.T2B1,
                    caPubKeys: [],
                },
            },
        });

        if (result.success) {
            expect(result.payload.valid).toEqual(false);
            expect(result.payload.error).toEqual('CA_PUBKEY_NOT_FOUND');
        }
    });
});
