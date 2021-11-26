const fetch = require('node-fetch').default;
const TrezorLink = require('../../lib').default;
const messages = require('../messages.json');

const { wait, setup, Controller } = global.Trezor;

const { BridgeV2 } = TrezorLink;

const controller = new Controller({
    url: 'ws://localhost:9001/',
});

describe('bridge', () => {
    beforeEach(async () => {
        await setup(controller);

        await wait(1000);
    })

    afterEach(() => {
        controller.disconnect()
    })

    test('enumerate - acquire - getFeatures', async () => {

        BridgeV2.setFetch(fetch)

        const bridge = new BridgeV2(null, null);
        await bridge.init(false);
        await bridge.configure(messages);

        const devices = await bridge.enumerate()

        expect(devices).toEqual(
            [
                {
                    path: '1',
                    session: null,
                    debugSession: null,
                    product: 0,
                    vendor: 0,
                    debug: true
                }
            ]
        )

        const session = await bridge.acquire({ path: devices[0].path });

        const callRes = await bridge.call(session, 'GetFeatures', {});

        expect(callRes).toEqual({
            type: 'Features',
            message: {
                vendor: 'trezor.io',
                major_version: 2,
                minor_version: 4,
                patch_version: 1,
                bootloader_mode: null,
                device_id: '355C817510C0EABF2F147145',
                pin_protection: false,
                passphrase_protection: false,
                language: 'en-US',
                label: 'TrezorT',
                initialized: true,
                revision: '24bb4016388fca4b998285b95dcd408f4ed0bff6',
                bootloader_hash: null,
                imported: null,
                unlocked: true,
                firmware_present: null,
                needs_backup: false,
                flags: 0,
                model: 'T',
                fw_major: null,
                fw_minor: null,
                fw_patch: null,
                fw_vendor: null,
                fw_vendor_keys: null,
                unfinished_backup: false,
                no_backup: false,
                recovery_mode: false,
                capabilities: [
                    1, 2, 3, 4, 5, 6, 7,
                    8, 9, 10, 11, 12, 13, 14,
                    15, 16, 17
                ],
                backup_type: 'Bip39',
                sd_card_present: true,
                sd_protection: false,
                wipe_code_protection: false,
                session_id: null,
                passphrase_always_on_device: false,
                safety_checks: 'Strict',
                auto_lock_delay_ms: 600000,
                display_rotation: 0,
                experimental_features: false
            }
        });
    })
})

// export { }