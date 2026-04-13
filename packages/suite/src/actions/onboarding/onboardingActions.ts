import { type OnboardingAnalytics, asTypedDesktopAnalytics, events } from '@suite/analytics';
import { initialRunCompleted } from '@suite/flags';
import { closeModal } from '@suite/modal';
import { recoveryRerunThunk } from '@suite/recovery';
import { closeModalApp, goto } from '@suite/router';
import {
    selectIsDeviceAuthenticityCheckEnabled,
    selectIsUnlockedBootloaderAllowed,
} from '@suite/settings';
import { selectSelectedDevice } from '@suite-common/device';
import { type ExtraDependencies } from '@suite-common/redux-utils';
import { type BackupType } from '@suite-common/suite-types';
import {
    changeNetworks,
    selectEnabledNetworks,
    startDiscoveryThunk,
} from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';

import { ONBOARDING } from 'src/actions/onboarding/constants';
import { stepCategories } from 'src/config/onboarding/steps';
import * as STEP from 'src/constants/onboarding/steps';
import { type AnyPath, type AnyStepId } from 'src/types/onboarding';
import { type Dispatch, type GetState } from 'src/types/suite';
import {
    findNextStep,
    findPrevStep,
    isStepUsed,
    resolveNextAvailableStep,
} from 'src/utils/onboarding/steps';

import { selectOnboardingAnalytics } from '../../reducers/onboarding/onboardingReducer';

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
        isDeviceAuthenticityCheckEnabled: selectIsDeviceAuthenticityCheckEnabled(getState()),
        isUnlockedBootloaderAllowed: selectIsUnlockedBootloaderAllowed(getState()),
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

const goToSuite = () => (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
    const device = selectSelectedDevice(getState());
    const onboardingAnalytics = selectOnboardingAnalytics(getState());
    // Clear modals that might block navigation. They aren't relevant anyway, as there is no <ModalSwitcher /> in onboarding.
    // After device interaction, Connect sends UI_REQUEST.CLOSE_UI_WINDOW to close any open modal. On Web this is
    // instant, so nothing blocks navigation, but on Desktop there is delay, so we must clear the modal manually to
    // ensure navigation to 'suite-index'. Particularly, setting PIN leaves ButtonRequest_Success hanging for a moment.
    dispatch(closeModal());

    dispatch(initialRunCompleted());
    dispatch(resetOnboarding());
    dispatch(closeModalApp(true));

    // Enable eth by default for new users unless the device has bitcoin-only firmware.
    if (!hasBitcoinOnlyFirmware(device)) {
        const enabledNetworks = selectEnabledNetworks(getState());
        if (!enabledNetworks.includes('eth')) {
            dispatch(changeNetworks([...enabledNetworks, 'eth']));
        }
    }

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

        asTypedDesktopAnalytics(extra.services.analytics).report({
            type: events.deviceSetupCompletedEvent.name,
            payload,
        });
    };
    reportAnalytics();
};

const goToNextStep = (nextStepId?: AnyStepId) => (dispatch: Dispatch, getState: GetState) => {
    if (nextStepId) {
        return dispatch(goToStep(nextStepId));
    }
    const device = selectSelectedDevice(getState());
    const stepsInPath = getAllStepsInPath(getState);
    const nextStep = findNextStep(getState().onboarding.activeStepId, stepsInPath, device ?? null);
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

const resolveNextAfterSkipped =
    (skippedToStepId: AnyStepId) => (_dispatch: Dispatch, getState: GetState) => {
        const device = selectSelectedDevice(getState());
        const stepsInPath = getAllStepsInPath(getState);
        const resolvedNextStep = resolveNextAvailableStep(
            skippedToStepId,
            stepsInPath,
            device ?? null,
        );

        return resolvedNextStep?.id;
    };

const recoveryRerun = () => async (dispatch: Dispatch, getState: GetState) => {
    const result = await dispatch(recoveryRerunThunk());

    if (!recoveryRerunThunk.fulfilled.match(result)) {
        return;
    }

    const { initialized } = result.payload;
    const { router } = getState();

    if (initialized) {
        dispatch(goto({ routeName: 'recovery-index' }));
    } else {
        if (router.app !== 'onboarding') {
            dispatch(goto({ routeName: 'onboarding-index' }));
        }
        dispatch(goToStep('recovery'));
        dispatch(addPath('recovery'));
    }
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
    resolveNextAfterSkipped,
    recoveryRerun,
};
