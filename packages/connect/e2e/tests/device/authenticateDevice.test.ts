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
                '047f77368dea2d4d61e989f474a56723c3212dacf8a808d8795595ef38441427c4389bc454f02089d7f08b873005e4c28d432468997871c0bf286fd3861e21e96a',
            ],
            caPubKeys: [
                '04ba6084cb9fba7c86d5d5a86108a91d55a27056da4eabbedde88a95e1cae8bce3620889167aaf7f2db166998f950984aa195e868f96e22803c3cd991be31d39e7',
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
