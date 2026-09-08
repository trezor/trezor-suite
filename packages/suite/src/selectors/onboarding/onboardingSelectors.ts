import {
    type DeviceRootState,
    DeviceTrackingPhase,
    resolveDeviceByRef,
    selectDevices,
    selectSelectedDevice,
} from '@suite-common/device';

import { type OnboardingRootState } from 'src/reducers/onboarding/onboardingReducer';

export const selectOnboarding = (state: OnboardingRootState) => state.onboarding;

export const selectOnboardingPath = (state: OnboardingRootState) => state.onboarding.path;

export const selectOnboardingActiveStepId = (state: OnboardingRootState) =>
    state.onboarding.activeStepId;

export const selectOnboardingAnalytics = (state: OnboardingRootState) =>
    state.onboarding.onboardingAnalytics;

export const selectOnboardedDeviceRef = (state: OnboardingRootState) =>
    state.onboarding.deviceTracking.currentRef;

export const selectIsOnboardedDeviceTrackingArmed = (state: OnboardingRootState) =>
    state.onboarding.deviceTracking.phase !== DeviceTrackingPhase.Idle;

/**
 * The physical device being onboarded.
 *
 * Onboarding wipes and initialises the device, so it disconnects and comes back with a new path
 * and a freshly generated `device_id` — and while it is away the global selection moves to
 * whatever else is around. Every step therefore addresses this device through the ref rather than
 * through the selection, and gets `undefined` when it is genuinely unreachable instead of
 * silently getting a different device.
 *
 * The unarmed branch is the entry point only: before onboarding pins a device there is nothing to
 * resolve, so it follows the selection the user started from.
 */
export const selectOnboardedDevice = (state: OnboardingRootState & DeviceRootState) => {
    if (!selectIsOnboardedDeviceTrackingArmed(state)) {
        return selectSelectedDevice(state);
    }

    return resolveDeviceByRef({
        devices: selectDevices(state),
        ref: selectOnboardedDeviceRef(state),
    });
};
