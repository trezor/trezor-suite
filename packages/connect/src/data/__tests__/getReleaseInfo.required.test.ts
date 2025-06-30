import { FirmwareReleaseConfigInfo, FirmwareType, VersionArray } from '@trezor/device-utils';

import { getReleaseInfo } from '../firmwareInfo';

const { getDeviceFeatures, getReleaseData } = global.JestMocks;

const fixtures = [
    {
        desc: 'Having newer version makes release `isNewer` and probability 100 `shouldBeOffered` true',
        features: getDeviceFeatures({
            bootloader_mode: null,
            major_version: 2,
            minor_version: 8,
            patch_version: 7,
        }),
        release: getReleaseData(),
        conditions: {
            environment: { min_suite_version: '25.2.1' },
            rollout_probability: 100,
        },
        isBitcoinOnlyAvailable: true,
        firmwareType: FirmwareType.Regular,
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
        desc: 'Having newer version makes release `isNewer` and probability 0 `shouldBeOffered` false',
        features: getDeviceFeatures({
            bootloader_mode: null,
            major_version: 2,
            minor_version: 8,
            patch_version: 7,
        }),
        release: getReleaseData(),
        conditions: {
            environment: { min_suite_version: '25.2.1' },
            rollout_probability: 0,
        },
        isBitcoinOnlyAvailable: true,
        firmwareType: FirmwareType.Regular,
        result: {
            releaseConditions: {
                environment: { min_suite_version: '25.2.1' },
                rollout_probability: 0,
                shouldBeOffered: false,
            },
            release: getReleaseData(),
            intermediary: undefined,
            isRequired: false,
            isNewer: true,
            translations: getReleaseData().translations,
        },
    },
    {
        desc: 'Having latest version makes release `isNewer` false',
        features: getDeviceFeatures({
            bootloader_mode: null,
            major_version: 2,
            minor_version: 8,
            patch_version: 9,
        }),
        release: getReleaseData(),
        conditions: {
            environment: { min_suite_version: '25.2.1' },
            rollout_probability: 100,
        },
        isBitcoinOnlyAvailable: true,
        firmwareType: FirmwareType.Regular,
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
        desc: 'Having device version lower than min firmware version - requires intermediate',
        features: getDeviceFeatures({
            bootloader_mode: null,
            major_version: 2,
            minor_version: 6,
            patch_version: 0,
        }),
        release: getReleaseData(),
        conditions: {
            environment: { min_suite_version: '25.2.1' },
            rollout_probability: 100,
        },
        intermediary: {
            min_firmware_version: [1, 6, 2] as VersionArray,
            min_bootloader_version: [1, 8, 0] as VersionArray,
            firmware_revision: '592590cf66a9b62dfeee7e4d2afb6e01005e5b2c',
            url: '/some/path.bin',
            version: 1,
        },
        isBitcoinOnlyAvailable: true,
        firmwareType: FirmwareType.Regular,
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

describe('getReleaseInfo() in firmware mode', () => {
    fixtures.forEach(f => {
        it(f.desc, () => {
            const result = getReleaseInfo({
                features: f.features,
                release: f.release as FirmwareReleaseConfigInfo,
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
