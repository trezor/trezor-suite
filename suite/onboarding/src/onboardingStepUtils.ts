import { type TrezorDevice } from '@suite-common/suite-types';
import { getFirmwareVersion } from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';

import { stepCategories } from './onboardingStepCategories';
import * as STEP from './onboardingSteps';
import { type AnyPath, type AnyStepId, type Step, type StepCategory } from './types';

export const parseStepId = (stepId: AnyStepId) => {
    const activeStepCategory =
        stepCategories.find(({ steps }) => steps.map(({ id }) => id).includes(stepId)) ?? null;

    const activeStep = activeStepCategory?.steps.find(({ id }) => id === stepId) ?? null;

    return {
        activeStep,
        activeStepCategory,
    };
};

export type IsStepUsedProps = {
    device: TrezorDevice | undefined;
    onboardingPath: AnyPath[];
    isDeviceAuthenticityCheckEnabled: boolean;
    isUnlockedBootloaderAllowed: boolean;
};

export const isStepUsed = (step: Step, props: IsStepUsedProps): boolean => {
    const {
        device,
        onboardingPath,
        isDeviceAuthenticityCheckEnabled,
        isUnlockedBootloaderAllowed,
    } = props;
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

    if (
        device?.firmwareType &&
        Array.isArray(step.supportedFirmwareTypes) &&
        !step.supportedFirmwareTypes.includes(device.firmwareType)
    ) {
        return false;
    }

    if (step.id === STEP.ID_AUTHENTICATE_DEVICE_STEP) {
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

export const isStepCategoryUsed = (stepCategory: StepCategory, props: IsStepUsedProps): boolean =>
    stepCategory.steps.some(step => isStepUsed(step, props));

// Validates if Id of the next step is available, or returns the earliest next available step
export const resolveNextAvailableStep = (
    requestedStepId: AnyStepId | null,
    steps: Step[],
    device: TrezorDevice | null,
): Step | null => {
    const currentIndex = steps.findIndex((step: Step) => step.id === requestedStepId);

    // NOTE: the next step may not be in available steps at all
    // in that case, we would go to the first step which is incorrect, the onboarding is complete
    if (currentIndex === -1) {
        return null;
    }

    const nextStep = steps[currentIndex] ?? null;
    if (!nextStep) {
        return null;
    }

    if (nextStep.id === STEP.ID_SET_PIN_STEP && device) {
        // Skip PIN setup step only if device has PIN protection explicitly enabled
        if (device?.features?.pin_protection === true) {
            return resolveNextAvailableStep(steps[currentIndex + 1]?.id, steps, device);
        }
    }

    return nextStep;
};

// Calculates the next step given the current step Id
export const findNextStep = (
    currentStepId: AnyStepId,
    steps: Step[],
    device: TrezorDevice | null,
) => {
    const currentIndex = steps.findIndex((step: Step) => step.id === currentStepId);

    if (currentIndex === -1) {
        return null;
    }

    const nextStepOfCurrentIndex = steps[currentIndex + 1]?.id ?? null;

    return resolveNextAvailableStep(nextStepOfCurrentIndex, steps, device);
};

export const findPrevStep = (currentStepId: AnyStepId, steps: Step[]) => {
    const currentIndex = steps.findIndex((step: Step) => step.id === currentStepId);
    if (!steps[currentIndex - 1]) {
        throw new Error('no prev step exists');
    }

    return steps[currentIndex - 1];
};
