import onboarding from '@suite/reducers/onboarding/onboardingReducer';
import connect from '@suite/reducers/onboarding/connectReducer';
import recovery from '@suite/reducers/onboarding/recoveryReducer';
import newsletter from '@suite/reducers/onboarding/newsletterReducer';
import { RecoveryActionTypes } from '@onboarding-types/recovery';
import { NewsletterActionTypes } from '@onboarding-types/newsletter';
import { ConnectActionTypes } from '@onboarding-types/connect';

import { Action } from '@suite-types';

interface OnboardingAppState extends ReturnType<typeof onboarding> {
    connect?: ReturnType<typeof connect>;
    recovery?: ReturnType<typeof recovery>;
    newsletter?: ReturnType<typeof newsletter>;
}

export default function onboardingApp(state: OnboardingAppState | undefined, action: Action) {
    const onboardingState: OnboardingAppState = onboarding(state, action);
    return {
        prevDevice: onboardingState.prevDevice,
        activeStepId: onboardingState.activeStepId,
        activeSubStep: onboardingState.activeSubStep,
        selectedModel: onboardingState.selectedModel,
        path: onboardingState.path,
        connect: connect(
            onboardingState.connect,
            action as ConnectActionTypes,
        ),
        recovery: recovery(onboardingState.recovery, action as RecoveryActionTypes),
        newsletter: newsletter(onboardingState.newsletter, action as NewsletterActionTypes),
    };
}
