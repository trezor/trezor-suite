import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { initialRunCompleted } from '@suite/flags';
import { closeModal } from '@suite/modal';
import {
   type AnyStepId,
    STEP,
    addOnboardingPath,
    findNextStep,
    findPrevStep,
    goToOnboardingStep,
    isStepUsed,
    removeOnboardingPath,
    resetOnboarding,
    resolveNextAvailableStep,
    selectOnboardingAnalytics,
    stepCategories,
} from '@suite/onboarding';
import { recoveryRerunThunk } from '@suite/recovery';
import { closeModalApp, goto } from '@suite/router';
import {
    selectIsDeviceAuthenticityCheckEnabled,
    selectIsUnlockedBootloaderAllowed,
} from '@suite/settings';
import { selectSelectedDevice } from '@suite-common/device';
import { type ExtraDependencies } from '@suite-common/redux-utils';
import { startDiscoveryThunk } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import { type Dispatch, type GetState } from 'src/types/suite';

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

// TODO: Replace direct state.onboarding.* access above with selectors in the createThunk migration step

const goToPreviousStep = (stepId?: AnyStepId) => (dispatch: Dispatch, getState: GetState) => {
    if (stepId) {
        return dispatch(goToOnboardingStep(stepId));
    }
    const stepsInPath = getAllStepsInPath(getState);
    const prevStep = findPrevStep(getState().onboarding.activeStepId, stepsInPath);
    // steps listed in case statements contain path decisions, so we need
    // to remove saved paths from reducers to let user change it again.
    switch (prevStep.id) {
        case STEP.ID_CREATE_OR_RECOVER:
            dispatch(removeOnboardingPath([STEP.PATH_CREATE, STEP.PATH_RECOVERY]));
            break;
        default:
        // nothing
    }

    dispatch(goToOnboardingStep(prevStep.id));
};

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
        return dispatch(goToOnboardingStep(nextStepId));
    }
    const device = selectSelectedDevice(getState());
    const stepsInPath = getAllStepsInPath(getState);
    const nextStep = findNextStep(getState().onboarding.activeStepId, stepsInPath, device ?? null);
    // we are at last step, so go to Suite
    if (nextStep === null) {
        dispatch(goToSuite());

        return;
    }
    dispatch(goToOnboardingStep(nextStep.id));
};

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
        dispatch(goToOnboardingStep('recovery'));
        dispatch(addOnboardingPath('recovery'));
    }
};

export {
    goToNextStep,
    goToPreviousStep,
    goToSuite,
    beginOnboardingTutorial,
    resolveNextAfterSkipped,
    recoveryRerun,
};
