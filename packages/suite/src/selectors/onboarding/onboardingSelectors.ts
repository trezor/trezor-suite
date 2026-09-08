import {
    type DeviceRootState,
    DeviceTrackingPhase,
    resolveDeviceByRef,
    selectDevices,
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
 * whatever else is around. Every step therefore addresses this device through the ref, and gets
 * `undefined` when it is genuinely unreachable rather than silently getting a different device.
 *
 * Deliberately never falls back to the selection: a fallback is indistinguishable from a correct
 * answer at the call site, which is exactly how the drift got in. Whatever starts onboarding arms
 * the ref first — see the `armOnboardedDeviceTracking` call sites — so an unarmed read means
 * onboarding was entered without a device, and `undefined` is the honest answer.
 */
export const selectOnboardedDevice = (state: OnboardingRootState & DeviceRootState) =>
    resolveDeviceByRef({
        devices: selectDevices(state),
        ref: selectOnboardedDeviceRef(state),
    });
