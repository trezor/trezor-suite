import { getInfo } from '../index';

const { getReleasesT1, getReleasesT2, getDeviceFeatures } = global.JestMocks;

const fixtures = [
    {
        desc: 'actual bootloader version is lower then lowest bootloader version in releases and is lower than second lowest min_bootloader_version in releases',
        features: getDeviceFeatures({
            bootloader_mode: true,
            major_version: 1,
            minor_version: 0,
            patch_version: 0,
        }),
        releases: getReleasesT1([
            {
                version: [1, 3, 0],
                min_bootloader_version: [1, 2, 0],
                bootloader_version: [1, 2, 0],
            },
            {
                version: [1, 2, 0],
                min_bootloader_version: [1, 2, 0],
                bootloader_version: [1, 2, 0],
            },
            {
                version: [1, 0, 0],
                min_bootloader_version: [1, 0, 0],
                bootloader_version: [1, 1, 0],
            },
        ]),
        result: {
            changelog: [{ version: [1, 0, 0] }],
            release: {
                version: [1, 0, 0],
                min_bootloader_version: [1, 0, 0],
                bootloader_version: [1, 1, 0],
            },
            isLatest: false,
            isRequired: false,
            isNewer: null,
        },
    },
    {
        desc: 'can`t tell if offered release is newer than actual',
        features: getDeviceFeatures({
            bootloader_mode: true,
            major_version: 1,
            minor_version: 0,
            patch_version: 0,
        }),
        releases: getReleasesT1([
            {
                version: [1, 2, 0],
                min_bootloader_version: [1, 0, 0],
                bootloader_version: [1, 0, 0],
            },
            {
                version: [1, 1, 0],
                min_bootloader_version: [1, 0, 0],
                bootloader_version: [1, 0, 0],
            },
            {
                version: [1, 0, 0],
                min_bootloader_version: [1, 0, 0],
                bootloader_version: [1, 0, 0],
            },
        ]),
        result: {
            release: { version: [1, 2, 0] },
            isNewer: null,
        },
    },
    {
        desc: 'actual bootloader version is lower then lowest bootloader version in releases and is higher than lowest min_bootloader_version in releases',
        features: getDeviceFeatures({
            bootloader_mode: true,
            major_version: 1,
            minor_version: 1,
            patch_version: 0,
        }),
        releases: getReleasesT1([
            {
                version: [1, 4, 0],
                min_bootloader_version: [1, 0, 0],
                bootloader_version: [1, 2, 0],
            },
            {
                version: [1, 3, 0],
                min_bootloader_version: [1, 0, 0],
                bootloader_version: [1, 2, 0],
            },
            {
                version: [1, 2, 0],
                min_bootloader_version: [1, 0, 0],
                bootloader_version: [1, 2, 0],
            },
        ]),
        result: {
            release: { version: [1, 4, 0] },
            isLatest: true,
            isRequired: false,
        },
    },
    {
        desc: 'test bootloader multiple versions',
        features: getDeviceFeatures({
            bootloader_mode: true,
            major_version: 2,
            minor_version: 0,
            patch_version: 0,
            fw_major: 2,
            fw_minor: 0,
            fw_patch: 0,
        }),
        releases: getReleasesT2([
            {
                version: [2, 4, 0],
                min_bootloader_version: [2, 0, 0],
                min_firmware_version: [2, 3, 0],
            },
            {
                version: [2, 2, 0],
                min_bootloader_version: [2, 0, 0],
                min_firmware_version: [2, 0, 0],
            },
            {
                version: [2, 1, 0],
                min_bootloader_version: [2, 0, 0],
                min_firmware_version: [2, 0, 0],
            },
            {
                version: [2, 0, 0],
                min_bootloader_version: [2, 0, 0],
                min_firmware_version: [2, 0, 0],
            },
        ]),
        result: {
            release: { version: [2, 2, 0] },
            isLatest: false,
            isRequired: false,
        },
    },
    {
        desc: 'test bootloader lower version',
        features: getDeviceFeatures({
            bootloader_mode: true,
            major_version: 1,
            minor_version: 5,
            patch_version: 0,
        }),
        releases: getReleasesT1([
            {
                version: [1, 2, 0],
                min_bootloader_version: [1, 0, 0],
                bootloader_version: [1, 0, 0],
            },
            {
                version: [1, 1, 0],
                min_bootloader_version: [1, 0, 0],
                bootloader_version: [1, 0, 0],
            },
            {
                version: [1, 0, 0],
                min_bootloader_version: [1, 0, 0],
                bootloader_version: [1, 0, 0],
            },
        ]),
        result: null,
    },
];

describe('getInfo() in bootloader', () => {
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
