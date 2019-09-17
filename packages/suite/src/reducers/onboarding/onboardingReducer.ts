import produce from 'immer';
import { DEVICE, UI, Device } from 'trezor-connect';

import {
    OnboardingReducer,
    SET_STEP_ACTIVE,
    GO_TO_SUBSTEP,
    SELECT_TREZOR_MODEL,
    ADD_PATH,
    REMOVE_PATH,
} from '@suite/types/onboarding/onboarding';
import { AnyPath } from '@onboarding-types/steps';
import * as STEP from '@suite/constants/onboarding/steps';
import steps from '@onboarding-config/steps';
import {
    DEVICE_CALL_RESET,
    DEVICE_CALL_START,
    DEVICE_CALL_SUCCESS,
    DEVICE_CALL_ERROR,
} from '@suite/types/onboarding/connect';
import { Action } from '@suite-types';

const initialState: OnboardingReducer = {
    // todo: prevDevice is now used to solve two different things and it cant work
    // would be better to implement field "isMatchingPrevDevice" along with prevDevice
    // prevDevice is used only in firmwareUpdate so maybe move it to firmwareUpdate
    // and here leave only isMatchingPrevDevice ?
    prevDevice: null,
    selectedModel: null,
    activeStepId: STEP.ID_RECOVERY_STEP,
    activeSubStep: null,
    path: [],
    deviceCall: {
        name: null,
        isProgress: false,
        error: null,
        result: null,
    },
    uiInteraction: {
        name: undefined,
        counter: 0,
    },
};

const setPrevDevice = (state: OnboardingReducer, device: Device) => {
    // dont set prevDevice if we are in steps that dont care about it.
    const activeStep = steps.find(s => s.id === state.activeStepId);
    if (
        !activeStep ||
        !activeStep.disallowedDeviceStates ||
        !activeStep.disallowedDeviceStates.includes(STEP.DISALLOWED_IS_NOT_SAME_DEVICE)
    ) {
        return null;
    }

    // ts.
    if (!device.features) {
        return null;
    }
    if (!state.prevDevice || !state.prevDevice.features) {
        return device;
    }
    if (state.prevDevice.features.device_id !== device.features.device_id) {
        return state.prevDevice;
    }
    return device;
};

const addPath = (path: AnyPath, state: OnboardingReducer) => {
    if (!state.path.includes(path)) {
        return [...state.path, path];
    }
    return [...state.path];
};

const removePath = (paths: AnyPath[], state: OnboardingReducer) => {
    return state.path.filter(p => !paths.includes(p));
};

const setInteraction = (
    currentInteraction: OnboardingReducer['uiInteraction'],
    newInteraction: string,
) => {
    if (currentInteraction.name === newInteraction) {
        return {
            name: currentInteraction.name,
            counter: currentInteraction.counter + 1,
        };
    }
    return {
        name: newInteraction,
        counter: 0,
    };
};

const onboarding = (state: OnboardingReducer = initialState, action: Action) => {
    // return if not init
    return produce(state, draft => {
        switch (action.type) {
            case SET_STEP_ACTIVE:
                draft.activeStepId = action.stepId;
                draft.activeSubStep = null;
                break;
            case GO_TO_SUBSTEP:
                draft.activeSubStep = action.subStepId;
                break;
            case SELECT_TREZOR_MODEL:
                draft.selectedModel = action.model;
                break;
            case ADD_PATH:
                draft.path = addPath(action.payload, state);
                break;
            case REMOVE_PATH:
                draft.path = removePath(action.payload, state);
                break;
            case DEVICE.DISCONNECT:
                draft.prevDevice = setPrevDevice(state, action.payload);
                draft.uiInteraction = {
                    name: undefined,
                    counter: 0,
                };
                break;
            case DEVICE_CALL_RESET:
                draft.deviceCall = {
                    name: null,
                    isProgress: false,
                    error: null,
                    result: null,
                };
                draft.uiInteraction = {
                    name: undefined,
                    counter: 0,
                };
                break;
            case DEVICE_CALL_START:
                draft.deviceCall = {
                    ...state.deviceCall,
                    name: action.name,
                    isProgress: true,
                };
                break;
            case DEVICE_CALL_SUCCESS:
                draft.deviceCall = {
                    ...state.deviceCall,
                    isProgress: false,
                    error: null,
                    result: action.result,
                };
                draft.uiInteraction = {
                    name: undefined,
                    counter: 0,
                };
                break;
            case DEVICE_CALL_ERROR:
                draft.deviceCall = {
                    ...state.deviceCall,
                    name: action.name,
                    isProgress: false,
                    error: action.error,
                    result: null,
                };
                break;
            case UI.REQUEST_BUTTON:
                draft.uiInteraction = setInteraction(state.uiInteraction, action.payload.code);
                break;
            case UI.REQUEST_WORD:
                draft.uiInteraction = setInteraction(
                    state.uiInteraction,
                    // todo: maybe fix type in connect, it should be always string imho.
                    action.payload.type as string,
                );
                break;
            case UI.REQUEST_PIN:
                draft.uiInteraction = setInteraction(state.uiInteraction, action.type);
                break;
            default:
            //  no default
        }
    });
};

export default onboarding;
