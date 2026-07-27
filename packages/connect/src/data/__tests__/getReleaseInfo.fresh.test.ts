import type { FirmwareRelease } from '@trezor/device-utils';
import { DeviceModelInternal, FirmwareType } from '@trezor/device-utils';
import type { VersionArray } from '@trezor/utils/src/versionUtils';

import { getReleaseInfo } from '../firmwareInfo';

const { getDeviceFeatures, releasesT2T1 } = global.JestMocks;

// @ts-expect-error: indexing with noUncheckedIndexedAccess
const [latestT2T1]: [FirmwareRelease] = releasesT2T1;

const fixtures = [
    {
        desc: 'it should respect bootloader and offer intermediary',
        releasesOfDevice: releasesT2T1,
        features: getDeviceFeatures({
            bootloader_mode: true,
            major_version: 1,
            minor_version: 0,
            patch_version: 0,
            internal_model: DeviceModelInternal.T1B1,
            firmware_present: false,
        }),
        release: latestT2T1,
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
            release: latestT2T1,
            intermediary: {
                min_firmware_version: [1, 6, 2] as VersionArray,
                min_bootloader_version: [1, 8, 0] as VersionArray,
                version: 1,
            },
            isRequired: true,
            isNewer: true,
            translations: latestT2T1.translations,
        },
    },
];

describe('getReleaseInfo() for fresh device', () => {
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
