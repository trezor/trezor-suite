import { type RouterRootState, selectRouterApp } from '@suite/router';
import {
    selectIsDeviceAuthenticityCheckEnabled,
    selectIsUnlockedBootloaderAllowed,
} from '@suite/settings';
import { selectSelectedDevice } from '@suite-common/device';
import {
    selectDeviceAuthenticityByDeviceId,
    selectDeviceNeedsManualCheck,
} from '@suite-common/persistent-device-data';
import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import type { AcquiredDevice, TrezorDevice } from '@suite-common/suite-types';
import { isDeviceAcquired } from '@suite-common/suite-utils';

import { SHOULD_ROUTER_APP_SKIP_INTERACTIVE_DEVICE_CHECKS } from './config';
import type { AuthenticityChecksRootState } from './types';

/**
 * Whether the device supports Device Authenticity Check, incl. if it's in the right state to perform it.
 */
const getIsDeviceReadyForAuthenticityCheck = (device?: TrezorDevice): device is AcquiredDevice => {
    // It isn't possible to perform DAC for unacquired or bootloader devices.
    if (!isDeviceAcquired(device)) return false;
    if (device.mode === 'bootloader') return false;

    return SUPPORTS_DEVICE_AUTHENTICITY_CHECK[device.features.internal_model];
};

type IsDeviceAuthenticityCheckSupportedAndEnabledParams = {
    device: TrezorDevice | undefined;
    isDeviceAuthenticityCheckEnabled: boolean;
    isUnlockedBootloaderAllowed: boolean;
};

// TODO move to suite-common
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

// TODO move to suite-common
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

/**
 * Whether to enter the Interactive Device Checks Flow to perform the interactive security checks,
 * i.e. the checks that need to prompt the user for confirmation, and can be rerun again until success.
 * For the non-interactive checks, see `selectShouldDisplayDeviceCompromised`.
 *
 * - Manual Device Check: always reversible by user action.
 * - Device Authenticity Check: when failed result has been persisted, check will be redone.
 */
export const selectShouldEnterInteractiveDeviceChecks = (
    state: AuthenticityChecksRootState,
    device?: TrezorDevice,
): boolean => {
    const shouldDoManualDeviceCheck = selectDeviceNeedsManualCheck(state, device?.id);
    const shouldDoDeviceAuthenticityCheck = selectShouldCheckDeviceAuthenticity(state, device);

    return shouldDoManualDeviceCheck || shouldDoDeviceAuthenticityCheck;
};

export const selectShouldRouterAppSkipInteractiveDeviceChecks = (state: RouterRootState): boolean =>
    SHOULD_ROUTER_APP_SKIP_INTERACTIVE_DEVICE_CHECKS[selectRouterApp(state)];

export const selectShouldEnterInteractiveDeviceChecksOnRoute = (
    state: AuthenticityChecksRootState,
): boolean =>
    !selectShouldRouterAppSkipInteractiveDeviceChecks(state) &&
    selectShouldEnterInteractiveDeviceChecks(state, selectSelectedDevice(state));
