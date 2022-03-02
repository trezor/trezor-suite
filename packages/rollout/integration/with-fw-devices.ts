/**
 * Kind of an e2e test. With real life releases.json. Meant to be kind of documentation
 *
 * Find which fw should be offered for currently shipped T2 devices
 */

import { getInfo } from '../src/index';
import { Release } from '../src/utils/parse';

import RELEASES_T1 from '@trezor/connect-common/files/firmware/1/releases.json';

const { getDeviceFeatures } = global.JestMocks;

describe('Testing if getInfo and getBinary return same result when first called in firmware mode and later in bootloader', () => {
    it('firmware version 1.6.0 (bootloader 1.4.0)', () => {
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
            releases: RELEASES_T1 as Release[],
        });
        expect(info).toMatchObject({ release: { version: [1, 6, 3] } });
    });

    it('firmware version 1.6.3 (bootloader 1.5.1)', () => {
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
            releases: RELEASES_T1 as Release[],
        });
        expect(info).toMatchObject({ release: { version: targetVersion } });
    });
});
