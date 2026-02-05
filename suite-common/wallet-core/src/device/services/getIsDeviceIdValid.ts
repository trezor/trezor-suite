import { isDeviceKnown } from '@suite-common/suite-utils';
import type { Device } from '@trezor/connect';

// Checks if acquired device in normal mode has non-empty Id
export const getIsDeviceIdValid = (device?: Device): boolean => {
    if (!device) return true;
    const isAcquired = isDeviceKnown(device);
    // check not done for unacquired devices or bootloader devices
    if (!isAcquired || device.features.bootloader_mode === true) return true;

    return typeof device.id === 'string' && device.id.length > 0;
};
