import { type DeviceRootState, selectIsDeviceConnected } from '@suite-common/device';
import { type FirmwareRootState, selectFirmware } from '@suite-common/firmware';

import { type OnboardingRootState } from '#src/reducers/onboarding/onboardingState';

export const selectOnboarding = (state: OnboardingRootState) => state.onboarding;

export const selectOnboardingPath = (state: OnboardingRootState) => state.onboarding.path;

export const selectOnboardingActiveStepId = (state: OnboardingRootState) =>
    state.onboarding.activeStepId;

export const selectOnboardingAnalytics = (state: OnboardingRootState) =>
    state.onboarding.onboardingAnalytics;

/**
 * Whether onboarding treats the device as gone and lets the user leave it. Installing firmware
 * reboots the device, so it disconnects only until the installation reconnects it.
 */
export const selectIsOnboardingDeviceDisconnected = (
    state: DeviceRootState & FirmwareRootState,
): boolean => {
    const { status } = selectFirmware(state);
    const isFirmwareInstallationRunning = status === 'started' || status === 'thp-pairing';

    return !selectIsDeviceConnected(state) && !isFirmwareInstallationRunning;
};
