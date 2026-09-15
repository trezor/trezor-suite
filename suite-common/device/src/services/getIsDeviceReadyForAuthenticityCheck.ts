import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import type { AcquiredDevice, TrezorDevice } from '@suite-common/suite-types';
import { isDeviceAcquired } from '@suite-common/suite-utils';

/**
 * Whether the device supports Device Authenticity Check, incl. if it's in the right state to perform it.
 */
export const getIsDeviceReadyForAuthenticityCheck = (
    device?: TrezorDevice,
): device is AcquiredDevice => {
    // It isn't possible to perform DAC for unacquired or bootloader devices.
    if (!isDeviceAcquired(device)) return false;
    if (device.mode === 'bootloader') return false;

    return SUPPORTS_DEVICE_AUTHENTICITY_CHECK[device.features.internal_model];
};
