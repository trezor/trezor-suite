import { type RouterRootState, selectRouterApp } from '@suite/router';
import {
    selectIsDeviceAuthenticityCheckEnabled,
    selectIsUnlockedBootloaderAllowed,
} from '@suite/settings';
import { getIsDeviceAuthenticityCheckSupportedAndEnabled } from '@suite-common/device';
import { selectDeviceAuthenticityByDeviceId } from '@suite-common/persistent-device-data';
import type { TrezorDevice } from '@suite-common/suite-types';
import { isDeviceAcquired } from '@suite-common/suite-utils';

import { SHOULD_ROUTER_APP_SKIP_INTERACTIVE_DEVICE_CHECKS } from './config';
import type { AuthenticityChecksRootState } from './types';

// TODO maybe extract to suite-common (setting selectors have to be refactored to params)
/**
 * Select whether device is eligible to go through Device Authenticity Check (DAC):
 * - Device supports DAC and is ready to perform it
 * - DAC is enabled
 * - DAC hasn't been successfuly performed yet for this device.
 *
 * If there is a record of failure for this device, it is handled same as if no record exists, and we start a retry.
 * → keep retrying until a successful result.
 * A retry can succeed if the user has meanwhile changed settings( allowing debug keys, unlocked bootloader).
 */
export const selectShouldCheckDeviceAuthenticity = (
    state: AuthenticityChecksRootState,
    device?: TrezorDevice,
): boolean => {
    if (!isDeviceAcquired(device)) return false; // Only for Typescript
    const isDeviceAuthenticityCheckEnabled = selectIsDeviceAuthenticityCheckEnabled(state);
    const isUnlockedBootloaderAllowed = selectIsUnlockedBootloaderAllowed(state);
    const isDeviceAuthenticityCheckSupportedAndEnabled =
        getIsDeviceAuthenticityCheckSupportedAndEnabled({
            device,
            isDeviceAuthenticityCheckEnabled,
            isUnlockedBootloaderAllowed,
        });

    if (!isDeviceAuthenticityCheckSupportedAndEnabled) return false;

    const persistedResult = selectDeviceAuthenticityByDeviceId(state, device.id);
    const isSuccessfulPersistedResult = persistedResult?.valid === true;

    return !isSuccessfulPersistedResult;
};

export const selectShouldRouterAppSkipInteractiveDeviceChecks = (state: RouterRootState): boolean =>
    SHOULD_ROUTER_APP_SKIP_INTERACTIVE_DEVICE_CHECKS[selectRouterApp(state)];
