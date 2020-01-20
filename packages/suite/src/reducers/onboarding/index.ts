import onboarding from '@onboarding-reducers/onboardingReducer';
import newsletter from '@onboarding-reducers/newsletterReducer';
import { NewsletterActionTypes } from '@onboarding-types/newsletter';

import { Action } from '@suite-types';

interface OnboardingAppState extends ReturnType<typeof onboarding> {
    newsletter?: ReturnType<typeof newsletter>;
}

export default function onboardingApp(state: OnboardingAppState | undefined, action: Action) {
    const onboardingState: OnboardingAppState = onboarding(state, action);
    return {
        reducerEnabled: onboardingState.reducerEnabled,
        prevDevice: onboardingState.prevDevice,
        activeStepId: onboardingState.activeStepId,
        activeSubStep: onboardingState.activeSubStep,
        selectedModel: onboardingState.selectedModel,
        deviceCall: onboardingState.deviceCall,
        uiInteraction: onboardingState.uiInteraction,
        path: onboardingState.path,
        backupType: onboardingState.backupType,
        newsletter: newsletter(onboardingState.newsletter, action as NewsletterActionTypes),
    };
}
