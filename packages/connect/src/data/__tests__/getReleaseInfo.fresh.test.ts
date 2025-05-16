import { DeviceModelInternal, FirmwareType, VersionArray } from '@trezor/device-utils';
import { ReleaseInfo } from '@trezor/firmware-release-config/src/types';

import { getReleaseInfo } from '../firmwareInfo';

const { getReleaseData, getDeviceFeatures } = global.JestMocks;

const fixtures = [
    {
        desc: 'it should respect bootloader and offer intermediary',
        features: getDeviceFeatures({
            bootloader_mode: true,
            major_version: 1,
            minor_version: 0,
            patch_version: 0,
            internal_model: DeviceModelInternal.T1B1,
            firmware_present: false,
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
                version: 1,
            },
            isRequired: false,
            isNewer: true,
            translations: getReleaseData().translations,
        },
    },
];

describe('getReleaseInfo() for fresh device', () => {
    fixtures.forEach(f => {
        it(f.desc, () => {
            const result = getReleaseInfo({
                features: f.features,
                release: f.release as ReleaseInfo,
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
