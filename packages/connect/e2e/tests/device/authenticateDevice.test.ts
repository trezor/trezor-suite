import { DeviceModelInternal } from '@trezor/device-utils';

import TrezorConnect from '../../../src';
import { deviceAuthenticityConfig } from '../../../src/data/deviceAuthenticityConfig';
import { DeviceAuthenticityConfig } from '../../../src/data/deviceAuthenticityConfigTypes';
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
    const config = {
        ...deviceAuthenticityConfig,
        ...Object.fromEntries(
            Object.entries(deviceAuthenticityConfig)
                .filter(
                    ([_, value]) => typeof value === 'object' && value !== null && 'debug' in value,
                )
                .map(([key, value]: [string, any]) => [
                    key,
                    {
                        rootPubKeys: value.debug.rootPubKeys,
                        caPubKeys: value.debug.caPubKeys,
                    },
                ]),
        ),
    } as DeviceAuthenticityConfig;

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
                        .filter(([key, _]) =>
                            Object.values(DeviceModelInternal).includes(key as DeviceModelInternal),
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
                        .filter(([key, _]) =>
                            Object.values(DeviceModelInternal).includes(key as DeviceModelInternal),
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
