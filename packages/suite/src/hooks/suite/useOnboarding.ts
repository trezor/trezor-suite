import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as routerActions from '@suite-actions/routerActions';
import { useActions, useSelector } from '@suite-hooks';

export const useOnboarding = () => {
    const onboarding = useSelector(state => state.onboarding);

    const actions = useActions({
        goToStep: onboardingActions.goToStep,
        goToSubStep: onboardingActions.goToSubStep,
        goToNextStep: onboardingActions.goToNextStep,
        goToPreviousStep: onboardingActions.goToPreviousStep,
        goto: routerActions.goto,
    });

    return {
        ...onboarding,
        ...actions,
    };
};
