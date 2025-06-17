import { DeviceAuthenticityConfig } from '@trezor/connect/src/data/deviceAuthenticityConfigTypes';

import TrezorConnect from '../../../src';
import { conditionalTest, getController, initTrezorConnect, setup } from '../../common.setup';

const controller = getController();

describe('TrezorConnect.authenticateDevice', () => {
    beforeAll(async () => {
        await setup(controller, {
            mnemonic: 'mnemonic_all',
        });
        await initTrezorConnect(controller);
    });

    afterAll(() => {
        controller.dispose();
        TrezorConnect.dispose();
    });

    // NOTE: emulator uses different provisioning keys than production FW (different than ./data/deviceAuthenticityConfig)
    const config: DeviceAuthenticityConfig = {
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
        T3B1: {
            rootPubKeys: [
                '047f77368dea2d4d61e989f474a56723c3212dacf8a808d8795595ef38441427c4389bc454f02089d7f08b873005e4c28d432468997871c0bf286fd3861e21e96a',
            ],
            caPubKeys: [
                '0410a6bc4f9eb52fd450be2c365189ea6a523fdddd62e44566dc349a8c7f813144cde81c8c106b74bfceae9c8ca5202af635ce1a5330c41c708ebbf505e025c339',
            ],
        },
        T3T1: {
            rootPubKeys: [
                '04e48b69cd7962068d3cca3bcc6b1747ef496c1e28b5529e34ad7295215ea161dbe8fb08ae0479568f9d2cb07630cb3e52f4af0692102da5873559e45e9fa72959',
            ],
            caPubKeys: [
                '04829e8965018feb542e9236c9b2ce08f864a55ed9183d0259564f0e05345b04676a0bef36c59d21d3c24868b5601f0b1193a6bfcf6d814e1cfb79c2256a05e953',
            ],
        },
        T3W1: {
            rootPubKeys: [
                '04521192e173a9da4e3023f747d836563725372681eba3079c56ff11b2fc137ab189eb4155f371127651b5594f8c332fc1e9c0f3b80d4212822668b63189706578',
            ],
            caPubKeys: [
                '04a5d701fced9b5a2cd076a02d8a98e779c54946eefc7b2525fac782fa3d65b5d9e6a8c90946bd30b35dfeec34a053f1106ba130a8472037f2db8cf2c4b3b6e93a',
            ],
        },
    };

    conditionalTest(['!T2T1'], 'validation successful', async () => {
        const result = await TrezorConnect.authenticateDevice({
            config,
        });

        expect(result).toMatchObject({
            success: true,
            payload: { valid: true },
        });
    });

    conditionalTest(['!T2T1'], 'validation unsuccessful (rootPubKey not found)', async () => {
        const result = await TrezorConnect.authenticateDevice({
            config: {
                ...config,
                ...Object.fromEntries(
                    Object.entries(config)
                        .filter(
                            ([_, value]) =>
                                typeof value === 'object' &&
                                value !== null &&
                                'rootPubKeys' in value,
                        )
                        .map(([key, value]) => [
                            key,
                            {
                                ...value,
                                rootPubKeys: [],
                            },
                        ]),
                ),
            },
        });

        expect(result).toMatchObject({
            success: true,
            payload: { valid: false, error: 'ROOT_PUBKEY_NOT_FOUND' },
        });
    });

    conditionalTest(['!T2T1'], 'sanity check unsuccessful (caPubkey not found)', async () => {
        const result = await TrezorConnect.authenticateDevice({
            config: {
                ...config,
                ...Object.fromEntries(
                    Object.entries(config)
                        .filter(
                            ([_, value]) =>
                                typeof value === 'object' &&
                                value !== null &&
                                'rootPubKeys' in value,
                        )
                        .map(([key, value]) => [
                            key,
                            {
                                ...value,
                                caPubKeys: [],
                            },
                        ]),
                ),
            },
        });

        expect(result).toMatchObject({
            success: true,
            payload: { valid: false, error: 'CA_PUBKEY_NOT_FOUND' },
        });
    });
});
