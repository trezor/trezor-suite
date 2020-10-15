/**
 * Kind of an e2e test. With real life releases.json. Meant to be kind of documentation
 *
 * Find which fw should be offered for currently shipped T2 devices
 */

import { getInfo, getBinary } from '../src/index';
import { Release } from '../src/utils/parse';

const { getDeviceFeatures } = global.JestMocks;

const RELEASES_T1 = JSON.parse(process.env.RELEASES_T1) as Release[];
const { BASE_FW_URL } = process.env;
const BETA_BASE_URL = process.env.BETA_BASE_FW_URL;

describe('Testing if getInfo and getBinary return same result when first called in firmware mode and later in bootloader', () => {
    it('firmware version 1.6.0 (bootloader 1.4.0)', async () => {
        const features = getDeviceFeatures({
            bootloader_mode: null,
            major_version: 1,
            minor_version: 6,
            patch_version: 1,
            firmware_present: null,
        });

        // first get info in firmware mode
        const info = getInfo({
            features,
            releases: RELEASES_T1,
        });
        expect(info).toMatchObject({ release: { version: [1, 6, 3] } });

        // validate that with binary returns the same firmware
        const withBinary = await getBinary({
            features: getDeviceFeatures({
                bootloader_mode: true,
                major_version: 1,
                minor_version: 4,
                patch_version: 0,
                firmware_present: true,
            }),
            releases: RELEASES_T1,
            baseUrl: BASE_FW_URL,
            baseUrlBeta: BETA_BASE_URL,
            version: [1, 6, 3],
        });
        expect(withBinary).toMatchObject({ release: { version: [1, 6, 3] } });
    });

    it('firmware version 1.6.3 (bootloader 1.5.1)', async () => {
        const targetVersion = RELEASES_T1[0].version; // latest
        // first get info in firmware mode
        const info = getInfo({
            features: getDeviceFeatures({
                bootloader_mode: null,
                major_version: 1,
                minor_version: 6,
                patch_version: 3,
                firmware_present: null,
            }),
            releases: RELEASES_T1,
        });
        expect(info).toMatchObject({ release: { version: targetVersion } });

        // validate that with binary returns the same firmware
        const withBinary = await getBinary({
            features: getDeviceFeatures({
                bootloader_mode: true,
                major_version: 1,
                minor_version: 5,
                patch_version: 1,
                firmware_present: true,
            }),
            version: targetVersion,
            releases: RELEASES_T1,
            baseUrl: BASE_FW_URL,
            baseUrlBeta: BETA_BASE_URL,
        });
        expect(withBinary).toMatchObject({ release: { version: targetVersion } });
    });
});
