import produce from 'immer';
import { DEVICE, UI, Device } from 'trezor-connect';

import {
    OnboardingState,
    SET_STEP_ACTIVE,
    GO_TO_SUBSTEP,
    SELECT_TREZOR_MODEL,
    ADD_PATH,
    REMOVE_PATH,
    RESET_ONBOARDING,
    ENABLE_ONBOARDING_REDUCER,
    SET_BACKUP_TYPE,
} from '@onboarding-types/onboarding';
import * as SUITE from '@suite-actions/constants/suiteConstants';
import { AnyPath } from '@onboarding-types/steps';
import * as STEP from '@suite/constants/onboarding/steps';
import steps from '@onboarding-config/steps';
import {
    DEVICE_CALL_RESET,
    DEVICE_CALL_START,
    DEVICE_CALL_SUCCESS,
    DEVICE_CALL_ERROR,
} from '@suite/types/onboarding/connect';
import * as CALLS from '@suite/actions/onboarding/constants/calls';

import { Action } from '@suite-types';

const initialState: OnboardingState = {
    reducerEnabled: false,
    // todo: prevDevice is now used to solve two different things and it cant work
    // would be better to implement field "isMatchingPrevDevice" along with prevDevice
    // prevDevice is used only in firmwareUpdate so maybe move it to firmwareUpdate
    // and here leave only isMatchingPrevDevice ?
    prevDevice: null,
    selectedModel: null,
    activeStepId: STEP.ID_WELCOME_STEP,
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
        counter: undefined,
    },
    // shamir or standard. we need to have this field in reducer for the case
    // when backup fails and user wants to retry it.
    backupType: 0,
};

const setPrevDevice = (state: OnboardingState, device: Device) => {
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

const updatePrevDevice = (draft: OnboardingState, device: Device) => {
    // wipeDevice call changes id
    if (draft.deviceCall.name === CALLS.WIPE_DEVICE && !draft.deviceCall.error) {
        draft.prevDevice = device;
    }
};

const addPath = (path: AnyPath, state: OnboardingState) => {
    if (!state.path.includes(path)) {
        return [...state.path, path];
    }
    return [...state.path];
};

const removePath = (paths: AnyPath[], state: OnboardingState) => {
    return state.path.filter(p => !paths.includes(p));
};

const setInteraction = (
    currentInteraction: OnboardingState['uiInteraction'],
    newInteraction: string,
) => {
    if (
        typeof currentInteraction.name === 'undefined' ||
        currentInteraction.name === newInteraction
    ) {
        const nextCounter =
            typeof currentInteraction.counter === 'number' ? currentInteraction.counter + 1 : 0;
        return {
            name: newInteraction,
            counter: nextCounter,
        };
    }
    return {
        name: newInteraction,
        counter: 0,
    };
};

const onboarding = (state: OnboardingState = initialState, action: Action) => {
    if (
        !state.reducerEnabled &&
        ![RESET_ONBOARDING, ENABLE_ONBOARDING_REDUCER].includes(action.type)
    ) {
        return state;
    }

    return produce(state, draft => {
        switch (action.type) {
            case ENABLE_ONBOARDING_REDUCER:
                draft.reducerEnabled = action.payload;
                break;
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
            case SET_BACKUP_TYPE:
                draft.backupType = action.payload;
                break;
            case DEVICE.DISCONNECT:
                draft.prevDevice = setPrevDevice(state, action.payload);
                draft.uiInteraction = initialState.uiInteraction;
                break;
            case DEVICE_CALL_RESET:
                draft.deviceCall = {
                    name: null,
                    isProgress: false,
                    error: null,
                    result: null,
                };
                draft.uiInteraction = initialState.uiInteraction;
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
                draft.uiInteraction = initialState.uiInteraction;
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
            case SUITE.UPDATE_SELECTED_DEVICE:
                updatePrevDevice(draft, action.payload);
                break;
            case RESET_ONBOARDING:
                return initialState;
            //  no default
        }
    });
};

export default onboarding;
