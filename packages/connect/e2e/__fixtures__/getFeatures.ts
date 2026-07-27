import { DeviceModelInternal } from '@trezor/device-utils';

const baseFeatures = {
    device_id: expect.any(String),
    vendor: 'trezor.io',
    major_version: expect.any(Number),
    minor_version: expect.any(Number),
    patch_version: expect.any(Number),
    bootloader_mode: null,
    bootloader_hash: null,
    pin_protection: expect.any(Boolean),
    passphrase_protection: expect.any(Boolean),
    language: 'en-US',
    label: expect.any(String),
    initialized: true,
    revision: expect.any(String),
    imported: null,
    unlocked: expect.any(Boolean),
    // flags: expect.any(Number), // flags may be changed by applyFlags test
    firmware_present: null,
    fw_major: null,
    fw_minor: null,
    fw_patch: null,
    fw_vendor: expect.any(String),
    unfinished_backup: expect.any(Boolean),
    no_backup: expect.any(Boolean),
    backup_availability: expect.any(String),
    wipe_code_protection: false,
    // session_id: expect.any(String), // in all except of T3W1
    safety_checks: expect.any(String),
    auto_lock_delay_ms: expect.any(Number),
};

const baseT1B1Features = {
    ...baseFeatures,
    bootloader_hash: expect.any(String), // difference between T2T1
    imported: true, // difference between T2T1
    sd_card_present: null, // no sdcard in T1B1
    sd_protection: null, // no sdcard in T1B1
    passphrase_always_on_device: null, // no support
    display_rotation: null, // no support
    experimental_features: null, // no support
    model: '1',
    internal_model: DeviceModelInternal.T1B1,
    backup_type: null, // no support
    recovery_status: null, // no support
    recovery_type: null, // no support
};

const tests = [
    {
        description: 'core devices features',
        skip: ['1'],
        params: {},
        result: {
            ...baseFeatures,
            model: expect.any(String), // "T" | "R"
            internal_model: expect.any(String),
            recovery_status: 'Nothing',
            capabilities: expect.arrayContaining([
                'Capability_Bitcoin',
                'Capability_Bitcoin_like',
                'Capability_Binance',
                'Capability_Cardano',
                'Capability_Crypto',
                'Capability_Ethereum',
                'Capability_Monero',
                'Capability_Ripple',
                'Capability_Stellar',
                'Capability_Tezos',
                'Capability_U2F',
                'Capability_Shamir',
                'Capability_ShamirGroups',
                'Capability_PassphraseEntry',
            ]),
            backup_type: 'Bip39',
            sd_card_present: expect.any(Boolean),
            sd_protection: false,
            passphrase_always_on_device: false,
            flags: expect.any(Number),
            display_rotation: 'North',
            experimental_features: expect.any(Boolean),
        },
        legacyResults: [
            {
                rules: ['<2.4.2'], // 2.4.2 removed Lisk capability
                success: true,
                payload: {
                    ...baseFeatures,
                },
            },
            {
                rules: ['<2.3.1'], // < 2.3.0 features missing some fields same as < 1.10.3
                success: true,
                payload: {
                    ...baseFeatures,
                    auto_lock_delay_ms: null,
                    fw_vendor: null,
                    safety_checks: null,
                },
            },
        ],
    },
    {
        description: 'T1B1 features',
        skip: ['2'],
        params: {},
        result: {
            ...baseT1B1Features,

            capabilities: expect.arrayContaining([
                'Capability_Bitcoin',
                'Capability_Bitcoin_like',
                'Capability_Crypto',
                'Capability_Ethereum',
                'Capability_Stellar',
                'Capability_U2F',
            ]),
        },
        legacyResults: [
            {
                rules: ['<1.11.1'],
                success: true,
                payload: {
                    ...baseT1B1Features,
                    fw_vendor: null,
                },
            },
            {
                rules: ['<1.10.3'],
                success: true,
                payload: {
                    ...baseT1B1Features,
                    fw_vendor: null,
                    safety_checks: null,
                },
            },
        ],
    },
];

const getFeatures: TestCase = {
    method: 'getFeatures',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests,
};

export default getFeatures;
