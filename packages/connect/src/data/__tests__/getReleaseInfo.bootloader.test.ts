import {
    ConditionalRelease,
    DeviceModelInternal,
    FirmwareType,
    VersionArray,
} from '@trezor/device-utils';

import { getReleaseInfo } from '../firmwareInfo';

const { getReleaseData, getDeviceFeatures } = global.JestMocks;

const fixtures = [
    {
        desc: 'Firmware version in bootloader mode and release version is newer than firmware version',
        features: getDeviceFeatures({
            bootloader_mode: true,
            fw_major: 2,
            fw_minor: 8,
            fw_patch: 7,
        }),
        release: getReleaseData(),
        conditions: {
            environment: { min_suite_version: '25.2.1' },
            rollout_probability: 100,
        },
        isBitcoinOnlyAvailable: true,
        firmwareType: FirmwareType.Regular,
        intermediary: undefined,
        result: {
            releaseConditions: {
                environment: { min_suite_version: '25.2.1' },
                rollout_probability: 100,
                shouldBeOffered: true,
            },
            release: getReleaseData(),
            intermediary: undefined,
            isRequired: false,
            isNewer: true,
            translations: getReleaseData().translations,
        },
    },
    {
        desc: 'Firmware version in bootloader mode is smaller than min_firmware_version so it offers intermediate FW',
        features: getDeviceFeatures({
            bootloader_mode: true,
            fw_major: 2,
            fw_minor: 6,
            fw_patch: 0,
        }),
        release: getReleaseData(),
        conditions: {
            environment: { min_suite_version: '25.2.1' },
            rollout_probability: 100,
        },
        isBitcoinOnlyAvailable: true,
        firmwareType: FirmwareType.Regular,
        intermediary: {
            min_firmware_version: [1, 6, 2] as VersionArray,
            min_bootloader_version: [1, 8, 0] as VersionArray,
            firmware_revision: '592590cf66a9b62dfeee7e4d2afb6e01005e5b2c',
            url: '/some/path.bin',
            version: 1,
        },
        result: {
            releaseConditions: {
                environment: { min_suite_version: '25.2.1' },
                rollout_probability: 100,
                shouldBeOffered: true,
            },
            release: getReleaseData(),
            intermediary: {
                min_firmware_version: [1, 6, 2] as VersionArray,
                min_bootloader_version: [1, 8, 0] as VersionArray,
                firmware_revision: '592590cf66a9b62dfeee7e4d2afb6e01005e5b2c',
                url: '/some/path.bin',
                version: 1,
            },
            isRequired: false,
            isNewer: true,
            translations: getReleaseData().translations,
        },
    },
    {
        desc: 'Firmware version in bootloader mode is latest version',
        features: getDeviceFeatures({
            bootloader_mode: true,
            internal_model: DeviceModelInternal.T1B1,
            fw_major: 2,
            fw_minor: 8,
            fw_patch: 10,
            major_version: 2,
            minor_version: 1,
            patch_version: 8,
        }),
        release: getReleaseData(),
        conditions: {
            environment: { min_suite_version: '25.2.1' },
            rollout_probability: 100,
        },
        isBitcoinOnlyAvailable: true,
        firmwareType: FirmwareType.Regular,
        intermediary: undefined,
        result: {
            releaseConditions: {
                environment: { min_suite_version: '25.2.1' },
                rollout_probability: 100,
                shouldBeOffered: true,
            },
            release: getReleaseData(),
            intermediary: undefined,
            isRequired: false,
            isNewer: false,
            translations: getReleaseData().translations,
        },
    },
    {
        desc: 'Bootloader does not report FW version - Firmware version in bootloader mode is smaller than min_firmware_version so it offers intermediate FW',
        features: getDeviceFeatures({
            bootloader_mode: true,
            internal_model: DeviceModelInternal.T1B1,
            major_version: 2,
            minor_version: 1,
            patch_version: 0,
        }),
        release: getReleaseData(),
        conditions: {
            environment: { min_suite_version: '25.2.1' },
            rollout_probability: 100,
        },
        isBitcoinOnlyAvailable: true,
        firmwareType: FirmwareType.Regular,
        intermediary: {
            min_firmware_version: [1, 6, 2] as VersionArray,
            min_bootloader_version: [1, 8, 0] as VersionArray,
            firmware_revision: '592590cf66a9b62dfeee7e4d2afb6e01005e5b2c',
            url: '/some/path.bin',
            version: 1,
        },
        result: {
            releaseConditions: {
                environment: { min_suite_version: '25.2.1' },
                rollout_probability: 100,
                shouldBeOffered: true,
            },
            release: getReleaseData(),
            intermediary: {
                min_firmware_version: [1, 6, 2] as VersionArray,
                min_bootloader_version: [1, 8, 0] as VersionArray,
                firmware_revision: '592590cf66a9b62dfeee7e4d2afb6e01005e5b2c',
                url: '/some/path.bin',
                version: 1,
            },
            isRequired: false,
            isNewer: true,
            translations: getReleaseData().translations,
        },
    },
];

describe('getReleaseInfo() in bootloader', () => {
    fixtures.forEach(f => {
        it(f.desc, () => {
            const result = getReleaseInfo({
                features: f.features,
                release: f.release as ConditionalRelease['release'],
                conditions: f.conditions,
                intermediary: f.intermediary,
                firmwareType: f.firmwareType,
                isBitcoinOnlyAvailable: f.isBitcoinOnlyAvailable,
            });
            if (f.result) {
                expect(result).toMatchObject(f.result);
            } else if (f.result === null) {
                expect(result).toBeNull();
            }
        });
    });
});
