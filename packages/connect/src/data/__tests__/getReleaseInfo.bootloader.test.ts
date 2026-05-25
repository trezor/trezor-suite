import type { FirmwareRelease } from '@trezor/device-utils';
import { DeviceModelInternal, FirmwareType } from '@trezor/device-utils';
import type { VersionArray } from '@trezor/utils/src/versionUtils';

import { getReleaseInfo } from '../firmwareInfo';

const { getDeviceFeatures, releasesT1B1, releasesT2T1 } = global.JestMocks;

// @ts-expect-error: indexing with noUncheckedIndexedAccess
const [latestT1B1]: [FirmwareRelease] = releasesT1B1;
// @ts-expect-error: indexing with noUncheckedIndexedAccess
const [latestT2T1]: [FirmwareRelease] = releasesT2T1;

const fixtures = [
    {
        desc: 'Firmware version in bootloader mode and release version is newer than firmware version',
        releasesOfDevice: releasesT2T1,
        features: getDeviceFeatures({
            bootloader_mode: true,
            firmware_present: true,
            fw_major: 2,
            fw_minor: 8,
            fw_patch: 7,
        }),
        release: latestT2T1,
        conditions: {
            environment: { min_suite_version: '25.2.1', min_suite_native_version: '25.2.1' },
            rollout_probability: 100,
        },
        isBitcoinOnlyAvailable: true,
        firmwareType: FirmwareType.Universal,
        intermediary: undefined,
        result: {
            releaseConditions: {
                environment: { min_suite_version: '25.2.1', min_suite_native_version: '25.2.1' },
                rollout_probability: 100,
                shouldBeOffered: true,
            },
            release: latestT2T1,
            intermediary: undefined,
            isRequired: false,
            isNewer: true,
            translations: latestT2T1.translations,
        },
    },
    {
        desc: 'Firmware version in firmware mode is smaller than min_firmware_version so it offers intermediate FW',
        releasesOfDevice: releasesT1B1,
        features: getDeviceFeatures({
            internal_model: DeviceModelInternal.T1B1,
            firmware_present: true,
            major_version: 1,
            minor_version: 6,
            patch_version: 2,
        }),
        release: latestT1B1,
        conditions: {
            environment: { min_suite_version: '25.2.1', min_suite_native_version: '25.2.1' },
            rollout_probability: 100,
        },
        isBitcoinOnlyAvailable: true,
        firmwareType: FirmwareType.Universal,
        intermediary: {
            min_firmware_version: [1, 6, 2] as VersionArray,
            min_bootloader_version: [1, 8, 0] as VersionArray,
            version: 1,
        },
        result: {
            releaseConditions: {
                environment: { min_suite_version: '25.2.1', min_suite_native_version: '25.2.1' },
                rollout_probability: 100,
                shouldBeOffered: true,
            },
            release: latestT1B1,
            intermediary: {
                min_firmware_version: [1, 6, 2] as VersionArray,
                min_bootloader_version: [1, 8, 0] as VersionArray,
                version: 1,
            },
            isRequired: true,
            isNewer: true,
            translations: latestT1B1.translations,
        },
    },
    {
        desc: 'Firmware version in bootloader mode is latest version',
        releasesOfDevice: releasesT1B1,
        features: getDeviceFeatures({
            bootloader_mode: true,
            firmware_present: true,
            internal_model: DeviceModelInternal.T1B1,
            fw_major: latestT1B1.version[0],
            fw_minor: latestT1B1.version[1],
            fw_patch: latestT1B1.version[2],
            major_version: latestT1B1.bootloader_version?.[0],
            minor_version: latestT1B1.bootloader_version?.[1],
            patch_version: latestT1B1.bootloader_version?.[2],
        }),
        release: latestT1B1,
        conditions: {
            environment: { min_suite_version: '25.2.1', min_suite_native_version: '25.2.1' },
            rollout_probability: 100,
        },
        isBitcoinOnlyAvailable: true,
        firmwareType: FirmwareType.Universal,
        intermediary: undefined,
        result: {
            releaseConditions: {
                environment: { min_suite_version: '25.2.1', min_suite_native_version: '25.2.1' },
                rollout_probability: 100,
                shouldBeOffered: true,
            },
            release: latestT1B1,
            intermediary: undefined,
            isRequired: null,
            isNewer: false,
            translations: latestT1B1.translations,
        },
    },
    {
        desc: 'Bootloader does not report FW version - Firmware version in bootloader mode is smaller than min_firmware_version so it offers intermediate FW',
        releasesOfDevice: releasesT1B1,
        features: getDeviceFeatures({
            bootloader_mode: true,
            firmware_present: true,
            internal_model: DeviceModelInternal.T1B1,
            major_version: 1,
            minor_version: 6,
            patch_version: 2,
        }),
        release: latestT1B1,
        conditions: {
            environment: { min_suite_version: '25.2.1', min_suite_native_version: '25.2.1' },
            rollout_probability: 100,
        },
        isBitcoinOnlyAvailable: true,
        firmwareType: FirmwareType.Universal,
        intermediary: {
            min_firmware_version: [1, 6, 2] as VersionArray,
            min_bootloader_version: [1, 8, 0] as VersionArray,
            firmware_revision: '592590cf66a9b62dfeee7e4d2afb6e01005e5b2c',
            url: '/some/path.bin',
            version: 1,
        },
        result: {
            releaseConditions: {
                environment: { min_suite_version: '25.2.1', min_suite_native_version: '25.2.1' },
                rollout_probability: 100,
                shouldBeOffered: true,
            },
            release: latestT1B1,
            intermediary: {
                min_firmware_version: [1, 6, 2] as VersionArray,
                min_bootloader_version: [1, 8, 0] as VersionArray,
                firmware_revision: '592590cf66a9b62dfeee7e4d2afb6e01005e5b2c',
                url: '/some/path.bin',
                version: 1,
            },
            isRequired: null,
            isNewer: true,
            translations: latestT1B1.translations,
        },
    },
];

describe('getReleaseInfo() in bootloader', () => {
    fixtures.forEach(f => {
        it(f.desc, () => {
            const result = getReleaseInfo({
                features: f.features,
                release: f.release as FirmwareRelease,
                conditions: f.conditions,
                intermediary: f.intermediary,
                firmwareType: f.firmwareType,
                isBitcoinOnlyAvailable: f.isBitcoinOnlyAvailable,
                releasesOfDevice: f.releasesOfDevice,
            });
            if (f.result) {
                expect(result).toMatchObject(f.result);
            } else if (f.result === null) {
                expect(result).toBeNull();
            }
        });
    });
});
