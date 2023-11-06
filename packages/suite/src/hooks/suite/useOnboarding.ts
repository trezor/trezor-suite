import { UI } from '@trezor/connect';
import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import * as routerActions from 'src/actions/suite/routerActions';
import * as recoveryActions from 'src/actions/recovery/recoveryActions';
import * as suiteActions from 'src/actions/suite/suiteActions';
import { useActions, useSelector, useDispatch } from 'src/hooks/suite';

export const useOnboarding = () => {
    const dispatch = useDispatch();

    const { onboarding, modal } = useSelector(state => state);

    const showPinMatrix =
        modal.context === '@modal/context-device' && modal.windowType === UI.REQUEST_PIN;

    const actions = useActions({
        goToStep: onboardingActions.goToStep,
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
        dispatch(routerActions.closeModalApp(true));

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
