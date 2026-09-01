import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { type OnboardingAnalytics } from '@suite/analytics';
import { selectModal } from '@suite/modal';
import { type BackupType } from '@suite-common/suite-types';
import { UI_REQUESTS } from '@trezor/connect';

import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import { type GoToSuiteOptions } from 'src/actions/onboarding/onboardingActions';
import { useSelector } from 'src/hooks/suite';
import { selectOnboarding } from 'src/selectors/onboarding/onboardingSelectors';
import { type AnyPath, type AnyStepId, type BackupMedium } from 'src/types/onboarding';

import { parseStepId } from '../../utils/onboarding/steps';

export const useOnboarding = () => {
    const dispatch = useDispatch();

    const onboarding = useSelector(selectOnboarding);
    const modal = useSelector(selectModal);

    const showPinMatrix =
        modal.context === '@modal/context-device' && modal.windowType === UI_REQUESTS.REQUEST_PIN;

    const actions = useMemo(
        () => ({
            goToStep: (stepId: AnyStepId) => dispatch(onboardingActions.goToStep(stepId)),
            goToNextStep: (stepId?: AnyStepId) => dispatch(onboardingActions.goToNextStep(stepId)),
            goToPreviousStep: () => dispatch(onboardingActions.goToPreviousStep()),
            resetOnboarding: () => dispatch(onboardingActions.resetOnboarding()),
            enableOnboardingReducer: (enabled: boolean) =>
                dispatch(onboardingActions.enableOnboardingReducer(enabled)),
            rerun: () => dispatch(onboardingActions.recoveryRerun()),
            updateAnalytics: (payload: Partial<OnboardingAnalytics>) =>
                dispatch(onboardingActions.updateAnalytics(payload)),
            addPath: (payload: AnyPath) => dispatch(onboardingActions.addPath(payload)),
            updateBackupType: (payload: BackupType) =>
                dispatch(onboardingActions.updateBackupType(payload)),
            updateBackupMedium: (payload: BackupMedium) =>
                dispatch(onboardingActions.updateBackupMedium(payload)),
            goToSuite: (options?: GoToSuiteOptions) =>
                dispatch(onboardingActions.goToSuite(options)),
            resolveNextAfterSkipped: (requestedStepId: AnyStepId) =>
                dispatch(onboardingActions.resolveNextAfterSkipped(requestedStepId)),
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
