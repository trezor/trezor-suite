import { BackupType } from '@suite-common/suite-types';
import { selectSelectedDevice, startDiscoveryThunk } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';
import { EventType, OnboardingAnalytics, analytics } from '@trezor/suite-analytics';

import { ONBOARDING } from 'src/actions/onboarding/constants';
import { stepCategories } from 'src/config/onboarding/steps';
import * as STEP from 'src/constants/onboarding/steps';
import { AnyPath, AnyStepId } from 'src/types/onboarding';
import { Dispatch, GetState } from 'src/types/suite';
import { findNextStep, findPrevStep, isStepUsed } from 'src/utils/onboarding/steps';

import { selectOnboardingAnalytics } from '../../reducers/onboarding/onboardingReducer';
import * as routerActions from '../suite/routerActions';
import * as suiteActions from '../suite/suiteActions';

export type OnboardingAction =
    | {
          type: typeof ONBOARDING.ENABLE_ONBOARDING_REDUCER;
          payload: boolean;
      }
    | {
          type: typeof ONBOARDING.RESET_ONBOARDING;
      }
    | {
          type: typeof ONBOARDING.REMOVE_PATH;
          payload: AnyPath[];
      }
    | {
          type: typeof ONBOARDING.ADD_PATH;
          payload: AnyPath;
      }
    | {
          type: typeof ONBOARDING.SET_STEP_ACTIVE;
          stepId: AnyStepId;
      }
    | {
          type: typeof ONBOARDING.ANALYTICS;
          payload: Partial<OnboardingAnalytics>;
      }
    | {
          type: typeof ONBOARDING.SELECT_BACKUP_TYPE;
          payload: BackupType;
      };

const goToStep = (stepId: AnyStepId): OnboardingAction => ({
    type: ONBOARDING.SET_STEP_ACTIVE,
    stepId,
});

const addPath = (payload: AnyPath): OnboardingAction => ({
    type: ONBOARDING.ADD_PATH,
    payload,
});

const removePath = (payload: AnyPath[]): OnboardingAction => ({
    type: ONBOARDING.REMOVE_PATH,
    payload,
});

const getAllStepsInPath = (getState: GetState) => {
    const allSteps = stepCategories.flatMap(({ steps }) => steps);
    const isStepUsedProps = {
        device: selectSelectedDevice(getState()),
        onboardingPath: getState().onboarding.path,
        isDeviceAuthenticityCheckEnabled:
            getState().suite.settings.enabledSecurityChecks.deviceAuthenticity,
        isUnlockedBootloaderAllowed: getState().suite.settings.debug.isUnlockedBootloaderAllowed,
    };

    return allSteps.filter(step => isStepUsed(step, isStepUsedProps));
};

const goToPreviousStep = (stepId?: AnyStepId) => (dispatch: Dispatch, getState: GetState) => {
    if (stepId) {
        return dispatch(goToStep(stepId));
    }
    const stepsInPath = getAllStepsInPath(getState);
    const prevStep = findPrevStep(getState().onboarding.activeStepId, stepsInPath);
    // steps listed in case statements contain path decisions, so we need
    // to remove saved paths from reducers to let user change it again.
    switch (prevStep.id) {
        case STEP.ID_CREATE_OR_RECOVER:
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
const resetOnboarding = (): OnboardingAction => ({
    type: ONBOARDING.RESET_ONBOARDING,
});

const goToSuite = () => (dispatch: Dispatch, getState: GetState) => {
    const device = selectSelectedDevice(getState());
    const onboardingAnalytics = selectOnboardingAnalytics(getState());

    dispatch(suiteActions.initialRunCompleted());
    dispatch(resetOnboarding());
    dispatch(routerActions.closeModalApp(true));

    dispatch(startDiscoveryThunk({ device }));

    // only to satisfy typescript, there must be a device to progress with onboarding
    if (device?.features === undefined) return;
    const reportAnalytics = () => {
        const payload = {
            ...onboardingAnalytics,
            duration: Date.now() - onboardingAnalytics.startTime!,
            device: device.features.internal_model,
            unitPackaging: device.features.unit_packaging ?? 0,
        };
        delete payload.startTime;

        analytics.report({
            type: EventType.DeviceSetupCompleted,
            payload,
        });
    };
    reportAnalytics();
};

const goToNextStep = (stepId?: AnyStepId) => (dispatch: Dispatch, getState: GetState) => {
    if (stepId) {
        return dispatch(goToStep(stepId));
    }
    const stepsInPath = getAllStepsInPath(getState);
    const nextStep = findNextStep(getState().onboarding.activeStepId, stepsInPath);
    // we are at last step, so go to Suite
    if (nextStep === null) {
        dispatch(goToSuite());

        return;
    }
    dispatch(goToStep(nextStep.id));
};

/**
 * Make onboarding reducer listen to actions.
 * @param payload,
 */

const enableOnboardingReducer = (payload: boolean): OnboardingAction => ({
    type: ONBOARDING.ENABLE_ONBOARDING_REDUCER,
    payload,
});

const updateAnalytics = (payload: Partial<OnboardingAnalytics>): OnboardingAction => ({
    type: ONBOARDING.ANALYTICS,
    payload,
});

const updateBackupType = (payload: BackupType): OnboardingAction => ({
    type: ONBOARDING.SELECT_BACKUP_TYPE,
    payload,
});

const beginOnboardingTutorial = () => async (dispatch: Dispatch, getState: GetState) => {
    const device = selectSelectedDevice(getState());
    if (!device) return;

    await TrezorConnect.showDeviceTutorial({ device });
    dispatch(goToNextStep());
};

export {
    enableOnboardingReducer,
    goToNextStep,
    goToStep,
    goToPreviousStep,
    addPath,
    removePath,
    resetOnboarding,
    goToSuite,
    updateAnalytics,
    beginOnboardingTutorial,
    updateBackupType,
};
