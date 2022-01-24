/**
 * Kind of an e2e test. With real life releases.json, create snapshots and evaulate if we are happy with
 * what was offered.
 *
 * Find which fw should be offered for currently shipped T2 devices
 */

import { getInfo, getBinary } from '../src';
import { Release } from '../src/utils/parse';
import { isNewerOrEqual } from '../src/utils/version';

const { getDeviceFeatures } = global.JestMocks;

// const RELEASES_T2 = JSON.parse(process.env.RELEASES_T2) as Release[];
const RELEASES_T1 = JSON.parse(process.env.RELEASES_T1) as Release[];
const BASE_URL = process.env.BASE_FW_URL;

describe('Find firmware info for: ', () => {
    it('bootloader 1.0.0 -> firmware version 1.6.3', async () => {
        const info = getInfo({
            features: getDeviceFeatures({
                bootloader_mode: true,
                major_version: 1,
                minor_version: 0,
                patch_version: 0,
                firmware_present: false,
            }),
            releases: RELEASES_T1,
        });
        expect(info).toMatchObject({ release: { version: [1, 6, 3] } });

        // validate that with binary returns the same firmware
        const withBinary = await getBinary({
            features: getDeviceFeatures({
                bootloader_mode: true,
                major_version: 1,
                minor_version: 0,
                patch_version: 0,
                firmware_present: false,
            }),
            version: [1, 6, 3],
            releases: RELEASES_T1,
            baseUrl: BASE_URL,
        });
        expect(withBinary).toMatchObject({ release: { version: [1, 6, 3] } });
    });

    it('bootloader 1.5.1 -> firmware version 1.10.0+', async () => {
        const info = getInfo({
            features: getDeviceFeatures({
                bootloader_mode: true,
                major_version: 1,
                minor_version: 5,
                patch_version: 1,
                firmware_present: false,
            }),
            releases: RELEASES_T1,
        });

        const targetVersion = info!.release.version;
        expect(isNewerOrEqual(targetVersion, [1, 10, 0])).toBe(true);

        // validate that with binary returns the same firmware
        const withBinary = await getBinary({
            features: getDeviceFeatures({
                bootloader_mode: true,
                major_version: 1,
                minor_version: 5,
                patch_version: 1,
                firmware_present: false,
            }),
            version: targetVersion,
            releases: RELEASES_T1,
            baseUrl: BASE_URL,
        });
        expect(withBinary).toMatchObject({ release: { version: targetVersion } });
    });
});
