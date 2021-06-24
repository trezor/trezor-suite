import { getBinary } from '../src';

const { getDeviceFeatures } = global.JestMocks;

const RELEASES_T1 = JSON.parse(process.env.RELEASES_T1);
const BASE_URL = process.env.BASE_FW_URL;

describe('getBinary()', () => {
    it('version sent in version param does not have its counterpart in releases list', async () => {
        await expect(
            getBinary({
                features: getDeviceFeatures({
                    major_version: 1,
                    minor_version: 8,
                    patch_version: 0,
                    fw_major: null,
                    fw_minor: null,
                    fw_patch: null,
                    bootloader_mode: true,
                    firmware_present: true,
                }),
                version: [1, 999, 9],
                releases: RELEASES_T1,
                baseUrl: BASE_URL,
            })
        ).rejects.toThrow('no firmware found for this device');
    });

    it('bitcoin only fw', async () => {
        const result = await getBinary({
            features: getDeviceFeatures({
                major_version: 1,
                minor_version: 8,
                patch_version: 0,
                fw_major: null,
                fw_minor: null,
                fw_patch: null,
                bootloader_mode: true,
                firmware_present: true,
            }),
            version: RELEASES_T1[0].version, // last version
            releases: RELEASES_T1,
            baseUrl: BASE_URL,
            btcOnly: true,
        });
        expect(result).toBeDefined();
    });

    it('bitcoin only fw does not exist', async () => {
        await expect(
            getBinary({
                features: getDeviceFeatures({
                    major_version: 1,
                    minor_version: 8,
                    patch_version: 0,
                    fw_major: null,
                    fw_minor: null,
                    fw_patch: null,
                    bootloader_mode: true,
                    firmware_present: true,
                }),
                version: [1, 8, 2],
                releases: RELEASES_T1,
                baseUrl: BASE_URL,
                btcOnly: true,
            })
        ).rejects.toThrow('firmware version 1,8,2 does not exist in btc only variant');
    });

    it('mismatch of requested firmware and firmware implicitly offered by bootloader check', async () => {
        await expect(
            getBinary({
                features: getDeviceFeatures({
                    major_version: 1,
                    minor_version: 8,
                    patch_version: 0,
                    fw_major: null,
                    fw_minor: null,
                    fw_patch: null,
                    bootloader_mode: true,
                    firmware_present: true,
                }),
                // current latest is 1.8.3 and it should be offered by bootloader, but we request
                // 1.8.2,
                version: [1, 8, 2],
                releases: RELEASES_T1,
                baseUrl: BASE_URL,
            })
        ).rejects.toThrow(
            'version provided as param does not match firmware version found by features in bootloader'
        );
    });

    it('success', async () => {
        const result = expect(
            await getBinary({
                features: getDeviceFeatures({
                    major_version: 1,
                    minor_version: 8,
                    patch_version: 0,
                    fw_major: null,
                    fw_minor: null,
                    fw_patch: null,
                    bootloader_mode: true,
                    firmware_present: true,
                }),
                version: RELEASES_T1[0].version, // last version
                releases: RELEASES_T1,
                baseUrl: BASE_URL,
            })
        );
        expect(result).toBeDefined();
    });
});
