/* eslint-disable camelcase */
import { versionUtils } from '@trezor/utils';

import type { StrictFeatures } from '../../types';

/**
 * Returns firmware binary after necessary modifications. Should be ok to install.
 */
export const modifyFirmware = ({ fw, features }: { fw: ArrayBuffer; features: StrictFeatures }) => {
    // ---------------------
    // Model T modifications
    // ---------------------
    // there are currently none.
    if (features.major_version === 2) return fw;

    // -----------------------
    // Model One modifications
    // -----------------------

    // any version installed on bootloader 1.8.0 must be sliced of the first 256 bytes (containing old firmware header)
    // unluckily, we don't know the actual bootloader of connected device, but we can assume it is 1.8.0 in case
    // getInfo() returns firmware with version 1.8.1 or greater as it has bootloader version 1.8.0 (see releases.json)
    // this should be temporary until special bootloader updating firmware are ready
    if (
        versionUtils.isNewerOrEqual(
            [features.major_version, features.minor_version, features.patch_version],
            [1, 8, 0],
        )
    ) {
        const fwView = new Uint8Array(fw);
        // this condition was added in order to upload firmware process being equivalent as in trezorlib python code
        if (
            String.fromCharCode(...Array.from(fwView.slice(0, 4))) === 'TRZR' &&
            String.fromCharCode(...Array.from(fwView.slice(256, 260))) === 'TRZF'
        ) {
            return fw.slice(256);
        }
    }
    return fw;
};
