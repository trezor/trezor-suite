import {
    OnboardingReducer,
    OnboardingActionTypes,
    SET_STEP_ACTIVE,
    SET_STEP_RESOLVED,
    GO_TO_SUBSTEP,
    SELECT_TREZOR_MODEL,
} from '@suite/types/onboarding/onboarding';
import { Step } from '@suite/types/onboarding/steps';

import * as STEP from '@suite/constants/onboarding/steps';

const initialState: OnboardingReducer = {
    selectedModel: null,
    activeStepId: STEP.ID_WELCOME_STEP,
    activeSubStep: null,
    steps: [
        {
            id: STEP.ID_WELCOME_STEP,
            visited: true,
        },
        {
            id: STEP.ID_SELECT_DEVICE_STEP,
            title: STEP.TITLE_SELECT_DEVICE_STEP,
        },
        {
            id: STEP.ID_UNBOXING_STEP,
            title: STEP.TITLE_UNBOXING_STEP,
        },
        {
            id: STEP.ID_BRIDGE_STEP,
            title: STEP.TITLE_BRIDGE_STEP,
        },
        {
            id: STEP.ID_CONNECT_STEP,
            title: STEP.TITLE_BRIDGE_STEP,
            disallowedDeviceStates: [STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE],
        },
        {
            id: STEP.ID_FIRMWARE_STEP,
            title: STEP.TITLE_FIRMWARE_STEP,
            disallowedDeviceStates: [
                STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
                STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
            ],
        },
        {
            id: STEP.ID_START_STEP,
            title: STEP.TITLE_START_STEP,
            disallowedDeviceStates: [
                STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
                STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
                STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
                STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
            ],
        },
        {
            id: STEP.ID_SECURITY_STEP,
            disallowedDeviceStates: [
                STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
                STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
                STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
                STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
            ],
        },
        {
            id: STEP.ID_BACKUP_STEP,
            title: STEP.TITLE_BACKUP_STEP,
            disallowedDeviceStates: [
                STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
                STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
                STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
                STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
            ],
        },
        {
            id: STEP.ID_SET_PIN_STEP,
            title: STEP.TITLE_SET_PIN_STEP,
            disallowedDeviceStates: [
                STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
                STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
                STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
                STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
            ],
        },
        {
            id: STEP.ID_NAME_STEP,
            title: STEP.TITLE_NAME_STEP,
            disallowedDeviceStates: [
                STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
                STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
                STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
                STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
                STEP.DISALLOWED_DEVICE_IS_REQUESTING_PIN,
            ],
        },
        {
            id: STEP.ID_BOOKMARK_STEP,
            title: STEP.TITLE_BOOKMARK_STEP,
            disallowedDeviceStates: [
                STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
                STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
                STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
                STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
                STEP.DISALLOWED_DEVICE_IS_REQUESTING_PIN,
            ],
        },
        {
            id: STEP.ID_NEWSLETTER_STEP,
            title: STEP.TITLE_NEWSLETTER_STEP,
            disallowedDeviceStates: [
                STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED,
                STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
                STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE,
                STEP.DISALLOWED_IS_NOT_SAME_DEVICE,
                STEP.DISALLOWED_DEVICE_IS_REQUESTING_PIN,
            ],
        },
        {
            id: STEP.ID_FINAL_STEP,
        },
    ],
};

const onboarding = (
    state: OnboardingReducer = initialState,
    action: OnboardingActionTypes,
): OnboardingReducer => {
    switch (action.type) {
        case SET_STEP_ACTIVE:
            return {
                ...state,
                activeStepId: action.stepId,
                activeSubStep: null,
            };
        // todo: not sure about resolved steps, maybe will not be used
        case SET_STEP_RESOLVED:
            return {
                ...state,
                steps: state.steps.map((step: Step) => {
                    if (step.id === action.stepId) {
                        return {
                            ...step,
                            ...{ resolved: true },
                        };
                    }
                    return step;
                }),
            };
        case GO_TO_SUBSTEP:
            return {
                ...state,
                activeSubStep: action.subStepId,
            };
        case SELECT_TREZOR_MODEL:
            return {
                ...state,
                selectedModel: action.model,
            };
        default:
            return state;
    }
};

export default onboarding;
