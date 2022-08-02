import { UI } from '@trezor/connect';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as routerActions from '@suite-actions/routerActions';
import * as recoveryActions from '@recovery-actions/recoveryActions';
import * as suiteActions from '@suite-actions/suiteActions';
import { useActions, useSelector } from '@suite-hooks';
import { useDispatch } from 'react-redux';

export const useOnboarding = () => {
    const dispatch = useDispatch();

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
        rerun: recoveryActions.rerun,
        updateAnalytics: onboardingActions.updateAnalytics,
        addPath: onboardingActions.addPath,
    });

    const goToSuite = (initialRedirection = false) => {
        dispatch(suiteActions.initialRunCompleted());
        dispatch(onboardingActions.resetOnboarding());
        dispatch(routerActions.closeModalApp());

        // fixes a bug that user ends up in settings after initialization of a new device because he navigated to settings before
        if (initialRedirection) {
            dispatch(routerActions.goto('suite-index'));
        }
    };

    return {
        ...onboarding,
        ...actions,
        showPinMatrix,
        goToSuite,
    };
};
