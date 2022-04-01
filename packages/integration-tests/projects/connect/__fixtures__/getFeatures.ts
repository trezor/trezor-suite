const { firmware } = global.Trezor;
// firmware should be always set. This tests actually tests the fact that
// we are indeed testing with the firmware version we believe we do.
const [major, minor, patch] = firmware.split('.');

// if custom build is used, we ignore firmware version numbers
const customFirmwareBuild =
    process.env.TESTS_CUSTOM_FIRMWARE_BUILD ||
    process.env.TESTS_FIRMWARE?.includes('master') ||
    // integration tests in trezor-firmware repo use 2.99.99 version
    process.env.TESTS_FIRMWARE === '2.99.99';

export default {
    method: 'getFeatures',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: 'TT features',
            skip: ['1'],
            params: {},
            result: {
                device_id: expect.any(String),
                vendor: 'trezor.io',
                major_version: customFirmwareBuild ? expect.any(Number) : Number(major),
                minor_version: customFirmwareBuild ? expect.any(Number) : Number(minor),
                patch_version: customFirmwareBuild ? expect.any(Number) : Number(patch),
                bootloader_mode: null,
                pin_protection: expect.any(Boolean),
                passphrase_protection: expect.any(Boolean),
                language: 'en-US',
                label: expect.any(String),
                initialized: true,
                revision: expect.any(String),
                bootloader_hash: null,
                imported: null,
                unlocked: expect.any(Boolean),
                firmware_present: null,
                needs_backup: expect.any(Boolean),
                // flags: expect.any(Number), // flags may be changed by applyFlags test
                model: 'T',
                fw_major: null,
                fw_minor: null,
                fw_patch: null,
                fw_vendor: null,
                unfinished_backup: expect.any(Boolean),
                no_backup: expect.any(Boolean),
                recovery_mode: false,
                capabilities: [
                    'Capability_Bitcoin',
                    'Capability_Bitcoin_like',
                    'Capability_Binance',
                    'Capability_Cardano',
                    'Capability_Crypto',
                    'Capability_EOS',
                    'Capability_Ethereum',
                    'Capability_Monero',
                    'Capability_NEM',
                    'Capability_Ripple',
                    'Capability_Stellar',
                    'Capability_Tezos',
                    'Capability_U2F',
                    'Capability_Shamir',
                    'Capability_ShamirGroups',
                    'Capability_PassphraseEntry',
                ],
                backup_type: 'Bip39',
                sd_card_present: true,
                sd_protection: false,
                wipe_code_protection: false,
                session_id: expect.any(String),
                passphrase_always_on_device: false,
            },
            legacyResults: [
                {
                    rules: ['<2.4.2'], // 2.4.2 removed Lisk capability
                    success: true,
                    payload: {
                        capabilities: [
                            'Capability_Bitcoin',
                            'Capability_Bitcoin_like',
                            'Capability_Binance',
                            'Capability_Cardano',
                            'Capability_Crypto',
                            'Capability_EOS',
                            'Capability_Ethereum',
                            'Capability_Lisk',
                            'Capability_Monero',
                            'Capability_NEM',
                            'Capability_Ripple',
                            'Capability_Stellar',
                            'Capability_Tezos',
                            'Capability_U2F',
                            'Capability_Shamir',
                            'Capability_ShamirGroups',
                            'Capability_PassphraseEntry',
                        ],
                        session_id: expect.any(String),
                        passphrase_always_on_device: false,
                    },
                },
                {
                    rules: ['<2.2.1'], // 2.2.1 added PassphraseEntry capability
                    success: true,
                    payload: {
                        capabilities: [
                            'Capability_Bitcoin',
                            'Capability_Bitcoin_like',
                            'Capability_Binance',
                            'Capability_Cardano',
                            'Capability_Crypto',
                            'Capability_EOS',
                            'Capability_Ethereum',
                            'Capability_Lisk',
                            'Capability_Monero',
                            'Capability_NEM',
                            'Capability_Ripple',
                            'Capability_Stellar',
                            'Capability_Tezos',
                            'Capability_U2F',
                            'Capability_Shamir',
                            'Capability_ShamirGroups',
                        ],
                        backup_type: 'Bip39',
                        session_id: null,
                        passphrase_always_on_device: null,
                    },
                },
                {
                    rules: ['<2.1.6'], // 2.1.6 added ShamirGroups capability
                    success: true,
                    payload: {
                        capabilities: [
                            'Capability_Bitcoin',
                            'Capability_Bitcoin_like',
                            'Capability_Binance',
                            'Capability_Cardano',
                            'Capability_Crypto',
                            'Capability_EOS',
                            'Capability_Ethereum',
                            'Capability_Lisk',
                            'Capability_Monero',
                            'Capability_NEM',
                            'Capability_Ripple',
                            'Capability_Stellar',
                            'Capability_Tezos',
                            'Capability_U2F',
                            'Capability_Shamir',
                        ],
                        backup_type: undefined,
                    },
                },
                {
                    rules: ['<2.1.5'], // 2.1.5 added Shamir and Lisk capability
                    success: true,
                    payload: {
                        capabilities: [
                            'Capability_Bitcoin',
                            'Capability_Bitcoin_like',
                            'Capability_Binance',
                            'Capability_Cardano',
                            'Capability_Crypto',
                            'Capability_EOS',
                            'Capability_Ethereum',
                            'Capability_Monero',
                            'Capability_NEM',
                            'Capability_Ripple',
                            'Capability_Stellar',
                            'Capability_Tezos',
                            'Capability_U2F',
                        ],
                        backup_type: undefined,
                    },
                },
            ],
        },
        {
            description: 'T1 features',
            skip: ['2'],
            params: {},
            result: {
                device_id: expect.any(String),
                vendor: 'trezor.io',
                major_version: customFirmwareBuild ? expect.any(Number) : Number(major),
                minor_version: customFirmwareBuild ? expect.any(Number) : Number(minor),
                patch_version: customFirmwareBuild ? expect.any(Number) : Number(patch),
                bootloader_mode: null,
                pin_protection: expect.any(Boolean),
                passphrase_protection: expect.any(Boolean),
                language: 'en-US',
                label: expect.any(String),
                initialized: true,
                revision: expect.any(String),
                bootloader_hash: expect.any(String), // difference between TT
                imported: true, // difference between TT
                unlocked: expect.any(Boolean),
                firmware_present: null,
                needs_backup: expect.any(Boolean),
                // flags: null, // flags may be changed by applyFlags test
                model: '1',
                fw_major: null,
                fw_minor: null,
                fw_patch: null,
                fw_vendor: null,
                unfinished_backup: expect.any(Boolean),
                no_backup: expect.any(Boolean),
                recovery_mode: null, // difference between TT
                capabilities: [
                    'Capability_Bitcoin',
                    'Capability_Bitcoin_like',
                    'Capability_Crypto',
                    'Capability_Ethereum',
                    'Capability_NEM',
                    'Capability_Stellar',
                    'Capability_U2F',
                ],
                backup_type: undefined, // difference between TT
                sd_card_present: null, // no sdcard in T1
                sd_protection: null, // no sdcard in T1
                wipe_code_protection: false,
                session_id: expect.any(String),
                passphrase_always_on_device: null, // no passphrase input on T1 device
            },
            legacyResults: [
                {
                    rules: ['<1.10.3'], // 1.10.3 removed Lisk capability
                    success: true,
                    payload: {
                        capabilities: [
                            'Capability_Bitcoin',
                            'Capability_Bitcoin_like',
                            'Capability_Crypto',
                            'Capability_Ethereum',
                            'Capability_Lisk',
                            'Capability_NEM',
                            'Capability_Stellar',
                            'Capability_U2F',
                        ],
                    },
                },
                {
                    rules: ['<1.8.3'], // 1.8.3 added Lisk capability
                    success: true,
                    payload: {
                        capabilities: [
                            'Capability_Bitcoin',
                            'Capability_Bitcoin_like',
                            'Capability_Crypto',
                            'Capability_Ethereum',
                            'Capability_NEM',
                            'Capability_Stellar',
                            'Capability_U2F',
                        ],
                    },
                },
            ],
        },
    ],
};
