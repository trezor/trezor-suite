import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { initialRunCompleted } from '@suite/flags';
import { closeModal } from '@suite/modal';
import { recoveryRerunThunk } from '@suite/recovery';
import { closeModalApp, goto, selectRouterApp } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { startDiscoveryThunk } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import {
    type OnboardingFlowRootState,
    addOnboardingPath,
    goToOnboardingStep,
    removeOnboardingPath,
    resetOnboarding,
    selectActiveStepId,
    selectFilteredOnboardingSteps,
    selectOnboardingAnalytics,
} from './onboardingReducer';
import { findNextStep, findPrevStep } from './onboardingStepUtils';
import * as STEP from './onboardingSteps';
import { type AnyStepId } from './types';

const ONBOARDING_THUNK_PREFIX = '@suite/onboarding';

export const goToSuite = createThunk(
    `${ONBOARDING_THUNK_PREFIX}/goToSuite`,
    (_, { dispatch, getState, extra }) => {
        const state = getState() as OnboardingFlowRootState;
        const device = selectSelectedDevice(state);
        const onboardingAnalytics = selectOnboardingAnalytics(state);
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
    },
);

export const goToNextStep = createThunk<void, AnyStepId | undefined>(
    `${ONBOARDING_THUNK_PREFIX}/goToNextStep`,
    (nextStepId, { dispatch, getState }) => {
        if (nextStepId !== undefined) {
            dispatch(goToOnboardingStep(nextStepId));

            return;
        }
        const device = selectSelectedDevice(getState());
        const stepsInPath = selectFilteredOnboardingSteps(getState());
        const nextStep = findNextStep(selectActiveStepId(getState()), stepsInPath, device ?? null);
        if (nextStep === null) {
            dispatch(goToSuite());

            return;
        }
        dispatch(goToOnboardingStep(nextStep.id));
    },
);

export const goToPreviousStep = createThunk<void, AnyStepId | undefined>(
    `${ONBOARDING_THUNK_PREFIX}/goToPreviousStep`,
    (stepId, { dispatch, getState }) => {
        if (stepId !== undefined) {
            dispatch(goToOnboardingStep(stepId));

            return;
        }
        const stepsInPath = selectFilteredOnboardingSteps(getState());
        const prevStep = findPrevStep(selectActiveStepId(getState()), stepsInPath);
        switch (prevStep.id) {
            case STEP.ID_CREATE_OR_RECOVER:
                dispatch(removeOnboardingPath([STEP.PATH_CREATE, STEP.PATH_RECOVERY]));
                break;
            default:
            // nothing
        }

        dispatch(goToOnboardingStep(prevStep.id));
    },
);

export const beginOnboardingTutorial = createThunk(
    `${ONBOARDING_THUNK_PREFIX}/beginOnboardingTutorial`,
    async (_, { dispatch, getState }) => {
        const device = selectSelectedDevice(getState() as OnboardingFlowRootState);
        if (!device) return;

        await TrezorConnect.showDeviceTutorial({ device });
        dispatch(goToNextStep(undefined));
    },
);

export const recoveryRerun = createThunk(
    `${ONBOARDING_THUNK_PREFIX}/recoveryRerun`,
    async (_, { dispatch, getState }) => {
        const result = await dispatch(recoveryRerunThunk());

        if (!recoveryRerunThunk.fulfilled.match(result)) {
            return;
        }

        const { initialized } = result.payload;

        if (initialized) {
            dispatch(goto({ routeName: 'recovery-index' }));
        } else {
            if (selectRouterApp(getState()) !== 'onboarding') {
                dispatch(goto({ routeName: 'onboarding-index' }));
            }
            dispatch(goToOnboardingStep('recovery'));
            dispatch(addOnboardingPath('recovery'));
        }
    },
);
