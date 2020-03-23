import { getBinary, getInfo } from '../src';

const { getDeviceFeatures } = global.JestMocks;

const RELEASES_T2 = JSON.parse(process.env.RELEASES_T2);
const RELEASES_T1 = JSON.parse(process.env.RELEASES_T1);
const BASE_URL = process.env.BASE_FW_URL;
const BETA_BASE_URL = process.env.BETA_BASE_FW_URL;

const FW_SIZE = 526272;

describe('getBinary() modifications of fw', () => {
    it('firmware installed on bootloader 1.8.0 should be return modified', async () => {
        const features = getDeviceFeatures({
            major_version: 1,
            minor_version: 8,
            patch_version: 0,
            firmware_present: null,
            bootloader_mode: null,
        });
        const info = getInfo({
            features,
            releases: RELEASES_T1,
        });

        // ts
        if (!info) throw new Error();

        const bootloaderFeatures = getDeviceFeatures({
            // not a bug, 1.8.0. fw has 1.8.0 bl as well
            major_version: 1,
            minor_version: 8,
            patch_version: 0,
            firmware_present: true,
            bootloader_mode: true,
        });

        const result = await getBinary({
            features: bootloaderFeatures,
            version: info?.release.version,
            releases: RELEASES_T1,
            baseUrl: BASE_URL,
            baseUrlBeta: BETA_BASE_URL,
        });
        if (result) {
            return expect(result.binary.byteLength).toEqual(FW_SIZE - 256);
        }
        expect(result).not.toBeNull();
    });

    it('some of the firmwares should be return unmodifed', async () => {
        const features = getDeviceFeatures({
            major_version: 1,
            minor_version: 6,
            patch_version: 3,
            fw_major: null,
            fw_minor: null,
            fw_patch: null,
            firmware_present: null,
            bootloader_mode: null,
        });

        const bootloaderFeatures = getDeviceFeatures({
            major_version: 1,
            minor_version: 5,
            patch_version: 1,
            firmware_present: true,
            bootloader_mode: true,
        });

        const info = getInfo({
            releases: RELEASES_T1,
            features,
        });

        // ts
        if (!info) throw new Error();

        const result = await getBinary({
            features: bootloaderFeatures,
            releases: RELEASES_T1,
            baseUrl: BASE_URL,
            version: info.release.version,
            baseUrlBeta: BETA_BASE_URL,
        });

        if (result) {
            return expect(result.binary.byteLength).toEqual(526272);
        }
        expect(result).not.toBeNull();
    });

    it('currently, no modification should be done for model T', async () => {
        const features = getDeviceFeatures({
            major_version: 2,
            minor_version: 0,
            patch_version: 5,
            fw_major: null,
            fw_minor: null,
            fw_patch: null,
            firmware_present: null,
            bootloader_mode: null,
        });
        const bootladerFeatures = getDeviceFeatures({
            major_version: 2,
            minor_version: 0,
            patch_version: 0,
            fw_major: 2,
            fw_minor: 0,
            fw_patch: 5,
            firmware_present: true,
            bootloader_mode: true,
        });

        const info = getInfo({
            features,
            releases: RELEASES_T2,
        });

        // ts
        if (!info) throw new Error();
        const result = await getBinary({
            features,
            releases: RELEASES_T2,
            baseUrl: BASE_URL,
            version: info.release.version,
            baseUrlBeta: BETA_BASE_URL,
        });

        if (result) {
            return expect(result.binary.byteLength).toEqual(1471488);
        }
        expect(result).not.toBeNull();
    });
});
