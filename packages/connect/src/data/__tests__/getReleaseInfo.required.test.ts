import type { FirmwareRelease } from '@trezor/device-utils';
import { FirmwareType } from '@trezor/device-utils';
import type { VersionArray } from '@trezor/utils/src/versionUtils';

import { getReleaseInfo } from '../firmwareInfo';

const { getDeviceFeatures, releasesT1B1, releasesT2T1 } = global.JestMocks;

const [latestT1B1] = releasesT1B1;
const [latestT2T1] = releasesT2T1;

const fixtures = [
    {
        desc: 'Having newer version makes release `isNewer` and probability 100 `shouldBeOffered` true',
        releasesOfDevice: releasesT2T1,
        features: getDeviceFeatures({
            bootloader_mode: null,
            major_version: 2,
            minor_version: 8,
            patch_version: 7,
        }),
        release: latestT2T1,
        conditions: {
            environment: { min_suite_version: '25.2.1', min_suite_native_version: '25.2.1' },
            rollout_probability: 100,
        },
        isBitcoinOnlyAvailable: true,
        firmwareType: FirmwareType.Universal,
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
        desc: 'Having newer version makes release `isNewer` and probability 0 `shouldBeOffered` false',
        releasesOfDevice: releasesT2T1,
        features: getDeviceFeatures({
            bootloader_mode: null,
            major_version: 2,
            minor_version: 8,
            patch_version: 7,
        }),
        release: latestT2T1,
        conditions: {
            environment: { min_suite_version: '25.2.1', min_suite_native_version: '25.2.1' },
            rollout_probability: 0,
        },
        isBitcoinOnlyAvailable: true,
        firmwareType: FirmwareType.Universal,
        result: {
            releaseConditions: {
                environment: { min_suite_version: '25.2.1', min_suite_native_version: '25.2.1' },
                rollout_probability: 0,
                shouldBeOffered: false,
            },
            release: latestT2T1,
            intermediary: undefined,
            isRequired: false,
            isNewer: true,
            translations: latestT2T1.translations,
        },
    },
    {
        desc: 'Having latest version makes release `isNewer` false',
        releasesOfDevice: releasesT2T1,
        features: getDeviceFeatures({
            bootloader_mode: null,
            firmware_present: true,
            major_version: latestT2T1.version[0],
            minor_version: latestT2T1.version[1],
            patch_version: latestT2T1.version[2],
        }),
        release: latestT2T1,
        conditions: {
            environment: { min_suite_version: '25.2.1', min_suite_native_version: '25.2.1' },
            rollout_probability: 100,
        },
        isBitcoinOnlyAvailable: true,
        firmwareType: FirmwareType.Universal,
        result: {
            releaseConditions: {
                environment: { min_suite_version: '25.2.1', min_suite_native_version: '25.2.1' },
                rollout_probability: 100,
                shouldBeOffered: true,
            },
            release: latestT2T1,
            intermediary: undefined,
            isRequired: null,
            isNewer: false,
            translations: latestT2T1.translations,
        },
    },
    {
        desc: 'Having device version lower than min firmware version - requires intermediate',
        releasesOfDevice: releasesT1B1,
        features: getDeviceFeatures({
            bootloader_mode: null,
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
        intermediary: {
            min_firmware_version: [1, 6, 2] as VersionArray,
            min_bootloader_version: [1, 8, 0] as VersionArray,
            version: 1,
        },
        isBitcoinOnlyAvailable: true,
        firmwareType: FirmwareType.Universal,
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
];

describe('getReleaseInfo() in firmware mode', () => {
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
