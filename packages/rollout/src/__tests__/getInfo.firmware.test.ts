import { getInfo } from '../index';

const { getReleasesT1, getReleasesT2, getDeviceFeatures } = global.JestMocks;

const fixtures = [
    {
        desc: 'for firmware version 1.0.0, there is no matching version in releases',
        features: getDeviceFeatures({
            bootloader_mode: null,
            firmware_present: null,
            major_version: 1,
            minor_version: 0,
            patch_version: 0,
            fw_major: null,
            fw_minor: null,
            fw_patch: null,
        }),
        releases: getReleasesT1([
            {
                version: [1, 3, 0],
                min_firmware_version: [1, 2, 0],
            },
            {
                version: [1, 2, 0],
                min_firmware_version: [1, 1, 0],
            },
        ]),
        result: null,
    },
    {
        desc: 'test single version bump',
        features: getDeviceFeatures({
            bootloader_mode: null,
            firmware_present: null,
            major_version: 2,
            minor_version: 0,
            patch_version: 0,
            fw_major: null,
            fw_minor: null,
            fw_patch: null,
        }),
        releases: getReleasesT2([
            {
                version: [2, 2, 0],
                min_firmware_version: [2, 0, 0],
                min_bootloader_version: [2, 0, 0],
            },
            {
                version: [2, 1, 0],
                min_firmware_version: [2, 0, 0],
                min_bootloader_version: [2, 0, 0],
            },
            {
                version: [2, 0, 0],
                min_firmware_version: [2, 0, 0],
                min_bootloader_version: [2, 0, 0],
            },
        ]),
        result: {
            release: { version: [2, 2, 0] },
            isLatest: true,
            isRequired: false,
            isNewer: true,
        },
    },
    {
        desc: 'test firmware multiple version bump',
        features: getDeviceFeatures({
            bootloader_mode: null,
            firmware_present: null,
            major_version: 2,
            minor_version: 0,
            patch_version: 0,
            fw_major: null,
            fw_minor: null,
            fw_patch: null,
        }),
        releases: getReleasesT2([
            {
                version: [2, 3, 0],
                min_firmware_version: [2, 0, 0],
                min_bootloader_version: [2, 0, 0],
            },
            {
                version: [2, 2, 0],
                min_firmware_version: [2, 0, 0],
                min_bootloader_version: [2, 0, 0],
            },
            {
                version: [2, 1, 0],
                min_firmware_version: [2, 0, 0],
                min_bootloader_version: [2, 0, 0],
            },
            {
                version: [2, 0, 0],
                min_firmware_version: [2, 0, 0],
                min_bootloader_version: [2, 0, 0],
            },
        ]),
        result: {
            release: { version: [2, 3, 0] },
            isRequired: false,
            isLatest: true,
            isNewer: true,
        },
    },
];
describe('getInfo() in normal (firmware) mode', () => {
    fixtures.forEach(f => {
        it(f.desc, () => {
            const result = getInfo({ features: f.features, releases: f.releases });
            if (f.result) {
                expect(result).toMatchObject(f.result);
            } else if (f.result === null) {
                expect(result).toBeNull();
            }
        });
    });
});
