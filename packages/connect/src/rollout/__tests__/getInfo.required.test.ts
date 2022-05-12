import { getInfo } from '../index';

const { getReleasesT2, getReleasesT1, getDeviceFeatures } = global.JestMocks;

const fixtures = [
    {
        desc: 'bootloader mode, newest fw is required',
        features: getDeviceFeatures({
            bootloader_mode: true,
            firmware_present: true,
            major_version: 2,
            minor_version: 0,
            patch_version: 0,
            fw_major: 2,
            fw_minor: 0,
            fw_patch: 0,
        }),
        releases: getReleasesT2([
            {
                version: [2, 1, 0],
                min_firmware_version: [2, 0, 0],
                min_bootloader_version: [2, 0, 0],
                required: true,
            },
            {
                version: [2, 0, 0],
                min_firmware_version: [2, 0, 0],
                min_bootloader_version: [2, 0, 0],
            },
        ]),
        result: {
            release: {
                version: [2, 1, 0],
            },
            isRequired: true,
        },
    },
    {
        desc: 'bootloader mode, middle fw is required but we are in bootloader and dont know',
        features: getDeviceFeatures({
            bootloader_mode: true,
            firmware_present: true,
            major_version: 1,
            minor_version: 0,
            patch_version: 0,
            fw_major: null,
            fw_minor: null,
            fw_patch: null,
        }),
        releases: getReleasesT1([
            {
                version: [1, 2, 0],
                min_firmware_version: [1, 0, 0],
                bootloader_version: [1, 0, 0],
                min_bootloader_version: [1, 0, 0],
            },
            {
                version: [1, 1, 0],
                min_firmware_version: [1, 0, 0],
                bootloader_version: [1, 0, 0],
                min_bootloader_version: [1, 0, 0],
                required: true,
            },
            {
                version: [1, 0, 0],
                min_firmware_version: [1, 0, 0],
                bootloader_version: [1, 0, 0],
                min_bootloader_version: [1, 0, 0],
            },
        ]),
        result: {
            release: {
                version: [1, 2, 0],
            },
            isRequired: null,
        },
    },
    {
        desc: 'bootloader mode, already installed fw is required',
        features: getDeviceFeatures({
            bootloader_mode: true,
            firmware_present: true,
            major_version: 2,
            minor_version: 0,
            patch_version: 0,
            fw_major: 2,
            fw_minor: 1,
            fw_patch: 0,
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
                required: true,
            },
            {
                version: [2, 0, 0],
                min_firmware_version: [2, 0, 0],
                min_bootloader_version: [2, 0, 0],
            },
        ]),
        result: {
            release: {
                version: [2, 2, 0],
            },
            isRequired: false,
        },
    },
    {
        desc: 'normal mode, newest fw is required',
        features: getDeviceFeatures({
            bootloader_mode: null,
            firmware_present: null,
            major_version: 2,
            minor_version: 0,
            patch_version: 1,
            fw_major: null,
            fw_minor: null,
            fw_patch: null,
        }),
        releases: getReleasesT2([
            {
                version: [2, 1, 0],
                min_firmware_version: [2, 0, 0],
                min_bootloader_version: [2, 0, 0],
                required: true,
            },
            {
                version: [2, 0, 1],
                min_firmware_version: [2, 0, 0],
                min_bootloader_version: [2, 0, 0],
            },
        ]),
        result: {
            release: {
                version: [2, 1, 0],
            },
            isRequired: true,
        },
    },
    {
        desc: 'normal mode, middle fw is required',
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
                version: [1, 2, 0],
                min_firmware_version: [1, 0, 0],
                bootloader_version: [1, 0, 0],
                min_bootloader_version: [1, 0, 0],
            },
            {
                version: [1, 1, 0],
                min_firmware_version: [1, 0, 0],
                bootloader_version: [1, 0, 0],
                min_bootloader_version: [1, 0, 0],
                required: true,
            },
            {
                version: [1, 0, 0],
                min_firmware_version: [1, 0, 0],
                bootloader_version: [1, 0, 0],
                min_bootloader_version: [1, 0, 0],
            },
        ]),
        result: {
            release: {
                version: [1, 2, 0],
            },
            isRequired: true,
        },
    },
    {
        desc: 'normal mode, already installed fw is required',
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
                required: true,
            },
        ]),
        result: {
            release: {
                version: [2, 2, 0],
            },
            isRequired: false,
        },
    },
];

describe('getInfo() test required updates', () => {
    fixtures.forEach(f => {
        it(f.desc, () => {
            const result = getInfo({ features: f.features, releases: f.releases });
            expect(result).not.toBeNull();
            expect(result).not.toBeUndefined();
            expect(result).toMatchObject(f.result);
        });
    });
});
