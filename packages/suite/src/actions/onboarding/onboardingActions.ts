import {
    SET_STEP_ACTIVE,
    GO_TO_SUBSTEP,
    SELECT_TREZOR_MODEL,
    ADD_PATH,
    REMOVE_PATH,
    RESET_ONBOARDING,
    ENABLE_ONBOARDING_REDUCER,
    SET_BACKUP_TYPE,
} from '@suite/types/onboarding/onboarding';
import * as STEP from '@onboarding-constants/steps';
import { AnyStepId, AnyPath } from '@onboarding-types/steps';
import steps from '@onboarding-config/steps';
import * as connectActions from '@onboarding-actions/connectActions';
import { findNextStep, findPrevStep, isStepInPath } from '@onboarding-utils/steps';

import { GetState, Dispatch, Action } from '@suite-types';

const goToStep = (stepId: AnyStepId) => (dispatch: Dispatch) => {
    dispatch({
        type: SET_STEP_ACTIVE,
        stepId,
    });
};

const goToSubStep = (subStepId: string | null) => (dispatch: Dispatch) => {
    dispatch({
        type: GO_TO_SUBSTEP,
        subStepId,
    });
};

const selectTrezorModel = (model: number) => ({
    type: SELECT_TREZOR_MODEL,
    model,
});

const addPath = (payload: AnyPath) => (dispatch: Dispatch) => {
    dispatch({
        type: ADD_PATH,
        payload,
    });
};

const removePath = (payload: AnyPath[]) => (dispatch: Dispatch) => {
    dispatch({
        type: REMOVE_PATH,
        payload,
    });
};

const goToNextStep = (stepId?: AnyStepId) => (dispatch: Dispatch, getState: GetState) => {
    if (stepId) {
        return dispatch(goToStep(stepId));
    }
    const { activeStepId, path } = getState().onboarding;
    const stepsInPath = steps.filter(step => isStepInPath(step, path));
    const nextStep = findNextStep(activeStepId, stepsInPath);
    dispatch(goToStep(nextStep.id));
};

const goToPreviousStep = (stepId?: AnyStepId) => (dispatch: Dispatch, getState: GetState) => {
    if (stepId) {
        return dispatch(goToStep(stepId));
    }
    const { activeStepId, path } = getState().onboarding;
    const stepsInPath = steps.filter(step => isStepInPath(step, path));
    const prevStep = findPrevStep(activeStepId, stepsInPath);

    // steps listed in case statements contain path decisions, so we need
    // to remove saved paths from reducers to let user change it again.
    switch (prevStep.id) {
        case STEP.ID_NEW_OR_USED:
            dispatch(removePath([STEP.PATH_NEW, STEP.PATH_USED]));
            break;
        case STEP.ID_WELCOME_STEP:
            dispatch(removePath([STEP.PATH_CREATE, STEP.PATH_RECOVERY]));
            break;
        default:
        // nothing
    }

    dispatch(goToStep(prevStep.id));
};

/**
 * Set onboarding reducer to initial state.
 */
const resetOnboarding = () => (dispatch: Dispatch) => {
    dispatch({
        type: RESET_ONBOARDING,
    });
};

/**
 * Make onboarding reducer listen to actions.
 * @param payload,
 */

const enableOnboardingReducer = (payload: boolean): Action => ({
    type: ENABLE_ONBOARDING_REDUCER,
    payload,
});

const retryBackup = () => async (dispatch: Dispatch) => {
    await dispatch(connectActions.wipeDevice());
    await dispatch(connectActions.resetDevice());
    await dispatch(connectActions.backupDevice());
};

const setBackupType = (payload: number): Action => ({
    type: SET_BACKUP_TYPE,
    payload,
});

export {
    enableOnboardingReducer,
    goToNextStep,
    goToSubStep,
    goToStep,
    goToPreviousStep,
    selectTrezorModel,
    addPath,
    removePath,
    resetOnboarding,
    retryBackup,
    setBackupType,
};
