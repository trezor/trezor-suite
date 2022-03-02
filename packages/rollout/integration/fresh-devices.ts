/**
 * Kind of an e2e test. With real life releases.json, create snapshots and evaulate if we are happy with
 * what was offered.
 *
 * Find which fw should be offered for currently shipped T2 devices
 */
import { versionUtils } from '@trezor/utils';

import { getInfo } from '../src';
import { Release } from '../src/utils/parse';

import RELEASES_T1 from '@trezor/connect-common/files/firmware/1/releases.json';

const { getDeviceFeatures } = global.JestMocks;

describe('Find firmware info for: ', () => {
    it('bootloader 1.0.0 -> firmware version 1.6.3', () => {
        const info = getInfo({
            features: getDeviceFeatures({
                bootloader_mode: true,
                major_version: 1,
                minor_version: 0,
                patch_version: 0,
                firmware_present: false,
            }),
            releases: RELEASES_T1 as Release[],
        });
        expect(info).toMatchObject({ release: { version: [1, 6, 3] } });
    });

    it('bootloader 1.5.1 -> firmware version 1.10.0+', () => {
        const info = getInfo({
            features: getDeviceFeatures({
                bootloader_mode: true,
                major_version: 1,
                minor_version: 5,
                patch_version: 1,
                firmware_present: false,
            }),
            releases: RELEASES_T1 as Release[],
        });

        const targetVersion = info!.release.version;
        expect(versionUtils.isNewerOrEqual(targetVersion, [1, 10, 0])).toBe(true);
    });
});
