import { useMemo } from 'react';

import { typeOnboardingAnalytics } from '@suite/analytics';
import {
   type AnyPath,
   type AnyStepId,
    addPath,
    enableOnboardingReducer,
    goToStep,
    parseStepId,
    resetOnboarding,
    updateAnalytics,
    updateBackupType,
} from '@suite/onboarding';
import { type BackupType } from '@suite-common/suite-types';
import { UI_REQUEST } from '@trezor/connect';

import {
    goToNextStep,
    goToPreviousStep,
    goToSuite,
    recoveryRerun,
    resolveNextAfterSkipped,
} from 'src/actions/onboarding/onboardingActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const useOnboarding = () => {
    const dispatch = useDispatch();

    const onboarding = useSelector(state => state.onboarding);
    const modal = useSelector(state => state.modal);

    const showPinMatrix =
        modal.context === '@modal/context-device' && modal.windowType === UI_REQUEST.REQUEST_PIN;

    const actions = useMemo(
        () => ({
            goToStep: (stepId: AnyStepId) => dispatch(goToStep(stepId)),
            goToNextStep: (stepId?: AnyStepId) => dispatch(goToNextStep(stepId)),
            goToPreviousStep: () => dispatch(goToPreviousStep()),
            resetOnboarding: () => dispatch(resetOnboarding()),
            enableOnboardingReducer: (enabled: boolean) => dispatch(enableOnboardingReducer(enabled)),
            rerun: () => dispatch(recoveryRerun()),
            updateAnalytics: (payload: Partial<OnboardingAnalytics>) =>
                dispatch(updateAnalytics(payload)),
            addPath: (payload: AnyPath) => dispatch(addPath(payload)),
            updateBackupType: (payload: BackupType) => dispatch(updateBackupType(payload)),
            goToSuite: () => dispatch(goToSuite()),
            resolveNextAfterSkipped: (requestedStepId: AnyStepId) =>
                dispatch(resolveNextAfterSkipped(requestedStepId)),
        }),
        [dispatch],
    );

    const { activeStepId } = onboarding;
    const { activeStep, activeStepCategory } = useMemo(
        () => parseStepId(activeStepId),
        [activeStepId],
    );

    return {
        ...onboarding,
        ...actions,
        activeStep,
        activeStepCategory,
        showPinMatrix,
    };
};
