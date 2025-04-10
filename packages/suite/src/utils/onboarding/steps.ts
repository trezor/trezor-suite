import { getFirmwareVersion } from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';

import { ID_AUTHENTICATE_DEVICE_STEP } from 'src/constants/onboarding/steps';
import { AnyPath, AnyStepId, Step, StepCategory } from 'src/types/onboarding';
import { TrezorDevice } from 'src/types/suite';

import { stepCategories } from '../../config/onboarding/steps';

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

export const isStepCategoryUsed = (stepCategory: StepCategory, props: IsStepUsedProps): boolean =>
    stepCategory.steps.filter(step => isStepUsed(step, props)).length > 0;

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
