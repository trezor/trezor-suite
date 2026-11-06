import {
    type PersistentDeviceDataRootState,
    selectDeviceAuthenticityByDeviceId,
} from '@suite-common/persistent-device-data';
import type { DeviceAuthenticityCheckSettings, TrezorDevice } from '@suite-common/suite-types';

import { getIsDeviceAuthenticityCheckSupportedAndEnabled } from './getIsDeviceAuthenticityCheckSupportedAndEnabled';

/**
 * Select whether device is eligible to go through Device Authenticity Check (DAC):
 * - Device supports DAC and is ready to perform it
 * - DAC is enabled
 * - DAC hasn't been successfuly performed yet for this device.
 *
 * If there is a record of failure for this device, it is handled same as if no record exists, and we start a retry.
 * → keep retrying until a successful result.
 * A retry can succeed if the user has meanwhile changed settings (allowing debug keys, unlocked bootloader).
 *
 * Not memoized, as the settings are passed as a fresh object, and the computation is cheap.
 */
export const selectShouldCheckDeviceAuthenticity = (
    state: PersistentDeviceDataRootState,
    device: TrezorDevice | undefined,
    settings: DeviceAuthenticityCheckSettings,
): boolean => {
    const isEnabledAndSupported = getIsDeviceAuthenticityCheckSupportedAndEnabled({
        device,
        ...settings,
    });
    if (!isEnabledAndSupported) return false;

    const persistedResult = selectDeviceAuthenticityByDeviceId(state, device?.id);
    const isSuccessfulPersistedResult = persistedResult?.valid === true;

    return !isSuccessfulPersistedResult;
};
