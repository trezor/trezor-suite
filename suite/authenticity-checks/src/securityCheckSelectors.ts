import {
    selectIsDeviceAuthenticityCheckEnabled,
    selectIsUnlockedBootloaderAllowed,
} from '@suite/settings';
import { selectDevices, selectSelectedDevice } from '@suite-common/device';
import {
    selectDeviceAuthenticityByDeviceId,
    selectShouldDoManualDeviceCheck,
} from '@suite-common/persistent-device-data';
import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import { type TrezorDevice } from '@suite-common/suite-types';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import type { AppState } from '@trezor/suite';

export const selectShouldCheckDeviceAuthenticity = (
    state: AppState,
    device?: TrezorDevice,
): boolean => {
    // It isn't possible to perform DAC for unacquired or bootloader devices.
    if (!isDeviceAcquired(device)) return false;
    if (device.mode === 'bootloader') return false;
    // Uninitialized device will go through onboarding, and DAC is one of the steps.
    if (device.mode === 'initialize') return false;

    const persistedResult = selectDeviceAuthenticityByDeviceId(state, device.id);
    // DAC already succeeded in the past for this device, so no need to check again.
    // If DAC has failed in the past, we want to keep showing it until it succeeds, so we handle it as if it hadn't been
    // performed yet (user can meanwhile change settings that would allow debug keys, unlocked bootloader).
    if (persistedResult?.valid === true) return false;

    const isDeviceAuthenticityCheckEnabled = selectIsDeviceAuthenticityCheckEnabled(state);
    const isUnlockedBootloaderAllowed = selectIsUnlockedBootloaderAllowed(state);

    // DAC *always* fails if bootloader is unlocked. So if user allowed it by settings, we skip the check, knowing it would fail otherwise.
    const isAllowedDebugDevice =
        isUnlockedBootloaderAllowed && device.features.bootloader_locked === false;

    return (
        SUPPORTS_DEVICE_AUTHENTICITY_CHECK[device.features.internal_model] &&
        isDeviceAuthenticityCheckEnabled &&
        !isAllowedDebugDevice
    );
};

/**
 * Whether SecurityCheck modal should be displayed for those checks, that need a user prompt to be performed,
 * and can be rerun again (manual device check, device authenticity check).
 * For checks which are final, see `selectShouldDisplayDeviceCompromised`.
 *
 * - Manual Device Check: always reversible by user action
 * - Device Authenticity Check: when failed result has been persisted, check will be redone
 */
export const selectShouldDisplaySecurityCheck = (
    state: AppState,
    device: TrezorDevice,
): boolean => {
    const shouldDoManualDeviceCheck = selectShouldDoManualDeviceCheck(state, device.id);
    const shouldDoDeviceAuthenticityCheck = selectShouldCheckDeviceAuthenticity(state, device);
    // eslint-disable-next-line no-console
    console.log(
        `${device.id?.slice(0, 8) ?? ''} ${shouldDoManualDeviceCheck ? 'MDC' : ''} ${shouldDoDeviceAuthenticityCheck ? 'DAC' : ''}`,
    );

    return shouldDoManualDeviceCheck || shouldDoDeviceAuthenticityCheck;
};

export const selectShouldDisplaySecurityCheckForSelectedDevice = (state: AppState) => {
    const device = selectSelectedDevice(state);
    if (!device) return false;

    return selectShouldDisplaySecurityCheck(state, device);
};

// THIS WILL BE USELESS AFTER ALL
export const selectAllDevicesRequiringSecurityCheck = (state: AppState): TrezorDevice[] => {
    const devices = selectDevices(state);

    return devices.filter(device => selectShouldDisplaySecurityCheck(state, device));
};
