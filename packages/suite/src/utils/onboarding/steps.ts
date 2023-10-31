import { selectDevice } from '@suite-common/wallet-core';

import { AnyStepId, AnyPath, Step } from 'src/types/onboarding';
import { GetState } from 'src/types/suite';
import { ID_AUTHENTICATE_DEVICE_STEP } from 'src/constants/onboarding/steps';

export const isStepUsed = (step: Step, getState: GetState) => {
    const state = getState();
    const device = selectDevice(state);

    const { path } = state.onboarding;
    const deviceModelInternal = device?.features?.internal_model;

    // The order of IF conditions matters!
    if (
        deviceModelInternal &&
        Array.isArray(step.supportedModels) &&
        !step.supportedModels.includes(deviceModelInternal)
    ) {
        return false;
    }
    if (step.id === ID_AUTHENTICATE_DEVICE_STEP) {
        const {
            isDeviceAuthenticityCheckDisabled,
            debug: { isUnlockedBootloaderAllowed },
        } = state.suite.settings;
        const isBootloaderUnlocked = device?.features?.bootloader_locked === false;
        return (
            !isDeviceAuthenticityCheckDisabled &&
            (!isUnlockedBootloaderAllowed || !isBootloaderUnlocked)
        );
    }
    if (!step.path) {
        return true;
    }
    if (path.length === 0) {
        return true;
    }
    return path.every(
        (pathMember: AnyPath) =>
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
