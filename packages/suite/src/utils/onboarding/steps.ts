import { selectSelectedDevice } from '@suite-common/wallet-core';
import { getFirmwareVersion } from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';

import { ID_AUTHENTICATE_DEVICE_STEP } from 'src/constants/onboarding/steps';
import { AnyPath, AnyStepId, Step } from 'src/types/onboarding';
import { AppState } from 'src/types/suite';

export const selectIsStepUsedContext = (state: AppState) => ({
    device: selectSelectedDevice(state),
    onboardingPath: state.onboarding.path,
    isDeviceAuthenticityCheckEnabled: state.suite.settings.enabledSecurityChecks.deviceAuthenticity,
    isUnlockedBootloaderAllowed: state.suite.settings.debug.isUnlockedBootloaderAllowed,
});
export type IsStepUsedContext = ReturnType<typeof selectIsStepUsedContext>;

export const isStepUsed = (step: Step, context: IsStepUsedContext): boolean => {
    const {
        device,
        onboardingPath,
        isDeviceAuthenticityCheckEnabled,
        isUnlockedBootloaderAllowed,
    } = context;
    const deviceModelInternal = device?.features?.internal_model;
    const firmwareVersion = getFirmwareVersion(device);

    // The order of IF conditions matters!
    if (
        deviceModelInternal &&
        Array.isArray(step.supportedModels) &&
        !(
            step.supportedModels.includes(deviceModelInternal) ||
            step.supportedModels.some(
                it =>
                    typeof it === 'object' &&
                    it.model === deviceModelInternal &&
                    firmwareVersion !== '' &&
                    versionUtils.isNewerOrEqual(firmwareVersion, it.minFwVersion),
            )
        )
    ) {
        return false;
    }

    if (step.id === ID_AUTHENTICATE_DEVICE_STEP) {
        const isBootloaderUnlocked = device?.features?.bootloader_locked === false;

        return (
            isDeviceAuthenticityCheckEnabled &&
            (!isUnlockedBootloaderAllowed || !isBootloaderUnlocked)
        );
    }

    if (!step.path) {
        return true;
    }

    if (onboardingPath.length === 0) {
        return true;
    }

    return onboardingPath.every((pathMember: AnyPath) =>
        step.path?.some((stepPathMember: AnyPath) => stepPathMember === pathMember),
    );
};

export const findNextStep = (currentStepId: AnyStepId, steps: Step[]) => {
    const currentIndex = steps.findIndex((step: Step) => step.id === currentStepId);
    if (!steps[currentIndex + 1]) {
        throw new Error('no next step exists');
    }

    return steps[currentIndex + 1];
};

export const findPrevStep = (currentStepId: AnyStepId, steps: Step[]) => {
    const currentIndex = steps.findIndex((step: Step) => step.id === currentStepId);
    if (!steps[currentIndex - 1]) {
        throw new Error('no prev step exists');
    }

    return steps[currentIndex - 1];
};
