import {
    type DeviceRootState,
    DeviceTrackingPhase,
    resolveDeviceByRef,
    selectConnectedDevices,
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

/**
 * Whether an onboarding run is under way.
 *
 * Being under way is the same thing as having a device pinned: everything that starts onboarding
 * arms the ref, and every exit dispatches `resetOnboarding`, which clears it. This replaces the
 * `isActive` flag the reducer used to carry, and the enable/disable action that set it.
 */
export const selectIsOnboardingInProgress = (state: OnboardingRootState) =>
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

/**
 * Whether the device in front of the user is a different one than onboarding was started with.
 *
 * Something is plugged in, and none of what is plugged in is the device onboarding pinned. That is
 * a swap, as opposed to the device merely being away mid-reboot, which leaves nothing connected
 * for the ref to fail against.
 *
 * Replaces comparing a remembered `prevDeviceId` against `device.id`, which onboarding itself
 * invalidates: initialising a device regenerates its `device_id`, so that comparison reported a
 * swap for the very same physical device.
 */
export const selectIsOnboardedDeviceReplaced = (state: OnboardingRootState & DeviceRootState) =>
    selectIsOnboardingInProgress(state) &&
    selectConnectedDevices(state).length > 0 &&
    selectOnboardedDevice(state) === undefined;
