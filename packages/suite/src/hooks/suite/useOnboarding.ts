import { UI } from 'trezor-connect';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as routerActions from '@suite-actions/routerActions';
import * as recoveryActions from '@recovery-actions/recoveryActions';
import { useActions, useSelector } from '@suite-hooks';

export const useOnboarding = () => {
    const { onboarding, modal } = useSelector(state => state);

    const showPinMatrix =
        modal.context === '@modal/context-device' && modal.windowType === UI.REQUEST_PIN;

    const actions = useActions({
        goToStep: onboardingActions.goToStep,
        goToSubStep: onboardingActions.goToSubStep,
        goToNextStep: onboardingActions.goToNextStep,
        goToPreviousStep: onboardingActions.goToPreviousStep,
        resetOnboarding: onboardingActions.resetOnboarding,
        enableOnboardingReducer: onboardingActions.enableOnboardingReducer,
        goto: routerActions.goto,
        rerun: recoveryActions.rerun,
    });

    return {
        ...onboarding,
        ...actions,
        showPinMatrix,
    };
};
