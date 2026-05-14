// eslint-disable-next-line import/no-extraneous-dependencies
import TrezorConnect from '@trezor/connect';
import type { DeviceAuthenticityConfig } from '@trezor/device-authenticity';
import { deviceAuthenticityConfig } from '@trezor/device-authenticity';
import { DeviceModelInternal } from '@trezor/device-utils';

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
        ...deviceAuthenticityConfig,
        ...Object.fromEntries(
            Object.entries(deviceAuthenticityConfig)
                // if debug property is available, replace the normal keys with debug keys, so that we can test them as if they were prod keys
                .filter(
                    ([_, value]) => typeof value === 'object' && value !== null && 'debug' in value,
                )
                .map(([key, value]: [string, any]) => [
                    key,
                    {
                        rootPubKeysOptiga: value.debug.rootPubKeysOptiga,
                        rootPubKeysTropic: value.debug.rootPubKeysTropic,
                    },
                ]),
        ),
    };

    // T3W1 skipped (#23966)
    /*conditionalTest(['*T3W1'], 'validation successful - tropic', async () => {
        const result = await TrezorConnect.authenticateDevice({
            config,
        });

        expect(result).toMatchObject({
            success: true,
            payload: {
                optigaResult: { valid: true },
                // trezor-user-env T3W1 has no tropic debug keys provisioned, but it is now required.
                // TODO change to true when it's fixed in trezor-user-env (this E2E will start failing)
                // once this is reenabled, note that the serialNumbers must match BETWEEN all results, else it will be failure
                tropicResult: { valid: false },
            },
        });
    });*/

    conditionalTest(['*T3T1', '*T3B1', '*T2B1'], 'validation successful - optiga', async () => {
        const result = await TrezorConnect.authenticateDevice({
            config,
        });

        expect(result).toMatchObject({
            success: true,
            payload: {
                optigaResult: { valid: true },
                tropicResult: null,
            },
        });
    });

    conditionalTest(
        ['!T2T1', '!T1B1', '!T3W1'], // T3W1 skipped (#23966)
        'validation unsuccessful (rootPubKey not found)',
        async () => {
            const result = await TrezorConnect.authenticateDevice({
                config: {
                    ...config,
                    ...Object.fromEntries(
                        Object.entries(config)
                            .filter(([key, _]) =>
                                Object.values(DeviceModelInternal).includes(
                                    key as DeviceModelInternal,
                                ),
                            )
                            .map(([key, _]) => [
                                key,
                                {
                                    rootPubKeysOptiga: [],
                                    rootPubKeysTropic: [],
                                },
                            ]),
                    ),
                },
            });

            expect(result).toMatchObject({
                success: true,
                payload: {
                    optigaResult: { valid: false, error: 'ROOT_PUBKEY_NOT_FOUND' },
                },
            });
        },
    );

    conditionalTest(
        ['*T3T1', '*T3B1', '*T2B1'],
        'sanity check unsuccessful (caPubkey is on blacklist)',
        async () => {
            const result = await TrezorConnect.authenticateDevice({
                config,
                blacklistConfig: {
                    version: 1,
                    blacklistedCaPubKeys: [
                        '04829e8965018feb542e9236c9b2ce08f864a55ed9183d0259564f0e05345b04676a0bef36c59d21d3c24868b5601f0b1193a6bfcf6d814e1cfb79c2256a05e953',
                        '0410a6bc4f9eb52fd450be2c365189ea6a523fdddd62e44566dc349a8c7f813144cde81c8c106b74bfceae9c8ca5202af635ce1a5330c41c708ebbf505e025c339',
                        '04e979dab5fc3ed274f7a217850af3d483ed7e221f9a9845e1462ad8dd63e51c084682d736675df6273a114289f26e0150bd1cda97834c537f11e3506761352159',
                        '04f7c60026bfbb9bc75bcdf57bc3357457a16cfe25293f996bc32ee73597c9864f5ed8d2359f58b6797d69ef03b50fc3e99ac02a893b945f67b460fa84a6b2b35c',
                    ],
                },
            });

            expect(result).toMatchObject({
                success: true,
                payload: {
                    optigaResult: { valid: false, error: 'CA_PUBKEY_BLACKLISTED' },
                },
            });
        },
    );
});
