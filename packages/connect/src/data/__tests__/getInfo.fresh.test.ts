import { getInfo } from '../firmwareInfo';

const { getReleasesT1, getReleasesT2, getDeviceFeatures } = global.JestMocks;

describe('getInfo() for fresh device', () => {
    it('it should respect bootloader rules and update incrementally by min_bootloader_version field', () => {
        const result = getInfo({
            features: getDeviceFeatures({
                bootloader_mode: true,
                major_version: 1,
                minor_version: 0,
                patch_version: 0,
                firmware_present: false,
            }),
            releases: getReleasesT1([
                {
                    version: [1, 2, 0],
                    min_bootloader_version: [1, 1, 0],
                },
                {
                    version: [1, 1, 0],
                    min_bootloader_version: [1, 0, 0],
                },
                {
                    version: [1, 0, 0],
                    min_bootloader_version: [1, 0, 0],
                },
            ]),
        });
        expect(result).toMatchObject({
            release: {
                version: [1, 1, 0],
            },
            isLatest: false,
            isRequired: false,
        });
    });

    it('the same for model 2', () => {
        const result = getInfo({
            features: getDeviceFeatures({
                bootloader_mode: true,
                major_version: 2,
                minor_version: 0,
                patch_version: 0,
                fw_major: null,
                fw_minor: null,
                fw_patch: null,
                firmware_present: false,
            }),
            releases: getReleasesT2([
                {
                    version: [2, 2, 0],
                    min_bootloader_version: [2, 2, 0],
                },
                {
                    version: [2, 1, 0],
                    min_bootloader_version: [2, 0, 0],
                },
                {
                    version: [2, 0, 0],
                    min_bootloader_version: [2, 0, 0],
                },
            ]),
        });
        expect(result).toMatchObject({
            release: {
                version: [2, 1, 0],
            },
            isLatest: false,
            isRequired: false,
        });
    });
});
