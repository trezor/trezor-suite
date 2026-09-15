import type { TrezorDevice } from '@suite-common/suite-types';

import { getIsDeviceReadyForAuthenticityCheck } from './getIsDeviceReadyForAuthenticityCheck';

type IsDeviceAuthenticityCheckSupportedAndEnabledParams = {
    device: TrezorDevice | undefined;
    isDeviceAuthenticityCheckEnabled: boolean;
    isUnlockedBootloaderAllowed: boolean;
};
/**
 * Select whether the device supports Device Authenticity Check (DAC), and it is not disabled by either:
 * - DAC generally disabled
 * - Device with unlocked bootloader and setting that tolerates it – DAC always fails if bootloader is unlocked,
 *   so tolerating it means that the check is effectively skipped for the device).
 */
export const getIsDeviceAuthenticityCheckSupportedAndEnabled = ({
    device,
    isDeviceAuthenticityCheckEnabled,
    isUnlockedBootloaderAllowed,
}: IsDeviceAuthenticityCheckSupportedAndEnabledParams): boolean => {
    if (!getIsDeviceReadyForAuthenticityCheck(device)) return false;
    const isAllowedDebugDevice =
        isUnlockedBootloaderAllowed && device.features.bootloader_locked === false;

    return isDeviceAuthenticityCheckEnabled && !isAllowedDebugDevice;
};
