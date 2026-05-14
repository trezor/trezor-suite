// firmware should be always set. This tests actually tests the fact that

import { DeviceModelInternal } from '@trezor/device-utils';

const emulatorStartOpts = process.env.EMULATOR_START_OPTS
    ? JSON.parse(process.env.EMULATOR_START_OPTS)
    : {};
const firmware = emulatorStartOpts.version;

let major;
let minor;
let patch;

if (firmware) {
    [major, minor, patch] = firmware.split('.');
}

// if custom build is used, we ignore firmware version numbers
const customFirmwareBuild =
    !firmware ||
    process.env.TESTS_CUSTOM_FIRMWARE_BUILD ||
    process.env.TESTS_FIRMWARE?.includes('master') ||
    // integration tests in trezor-firmware repo use 2.99.99 version
    process.env.TESTS_FIRMWARE === '2.99.99';

const baseFeatures = {
    device_id: expect.any(String),
    vendor: 'trezor.io',
    major_version: expect.any(Number),
    minor_version: expect.any(Number),
    patch_version: expect.any(Number),
    bootloader_mode: null,
    pin_protection: expect.any(Boolean),
    passphrase_protection: expect.any(Boolean),
    language: 'en-US',
    label: expect.any(String),
    initialized: true,
    revision: expect.any(String),
    imported: null,
    unlocked: expect.any(Boolean),
    firmware_present: null,
    fw_major: null,
    fw_minor: null,
    fw_patch: null,
    unfinished_backup: expect.any(Boolean),
    no_backup: expect.any(Boolean),
};

const tests = [
    {
        description: 'core devices features',
        skip: ['1'],
        params: {},
        result: {
            ...baseFeatures,
            bootloader_hash: null,
            backup_availability: expect.any(String),
            model: expect.any(String), // "T" | "R"
            internal_model: expect.any(String),
            unfinished_backup: expect.any(Boolean),
            no_backup: expect.any(Boolean),
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
            wipe_code_protection: false,
            passphrase_always_on_device: false,
            flags: expect.any(Number),
            fw_vendor: expect.any(String),
            safety_checks: expect.any(String),
            auto_lock_delay_ms: expect.any(Number),
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
        ],
    },
    {
        description: 'T1B1 features',
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
            bootloader_hash: expect.any(String), // difference between T2T1
            imported: true, // difference between T2T1
            unlocked: expect.any(Boolean),
            firmware_present: null,
            backup_availability: expect.any(String),
            // flags: null, // flags may be changed by applyFlags test
            model: '1',
            internal_model: DeviceModelInternal.T1B1,
            fw_major: null,
            fw_minor: null,
            fw_patch: null,
            // fw_vendor: null, // "EMULATOR" since 1.11.1
            unfinished_backup: expect.any(Boolean),
            no_backup: expect.any(Boolean),
            recovery_status: 'Nothing', // difference between T2T1
            capabilities: expect.arrayContaining([
                'Capability_Bitcoin',
                'Capability_Bitcoin_like',
                'Capability_Crypto',
                'Capability_Ethereum',
                'Capability_Stellar',
                'Capability_U2F',
            ]),
            recovery_type: undefined, // difference between T2T1
            sd_card_present: null, // no sdcard in T1B1
            sd_protection: null, // no sdcard in T1B1
            wipe_code_protection: false,
            session_id: expect.any(String),
            passphrase_always_on_device: null,
            flags: expect.any(Number),
            fw_vendor: expect.any(String),
            safety_checks: expect.any(String),
            auto_lock_delay_ms: expect.any(Number),
            display_rotation: 'North',
            experimental_features: expect.any(Boolean),
            backup_type: 'Bip39',
        },
        legacyResults: [
            {
                rules: ['<1.10.3'],
                success: true,
                payload: {
                    ...baseFeatures,
                },
            },
        ],
    },
];

export default {
    method: 'getFeatures',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests,
} satisfies TestCase;
