import onboarding from '@suite/reducers/onboarding/onboardingReducer';
import connect from '@suite/reducers/onboarding/connectReducer';
import recovery from '@suite/reducers/onboarding/recoveryReducer';
import firmwareUpdate from '@suite/reducers/onboarding/firmwareUpdateReducer';
import newsletter from '@suite/reducers/onboarding/newsletterReducer';
import { RecoveryActionTypes } from '@onboarding-types/recovery';
import { FirmwareUpdateActionTypes } from '@onboarding-types/firmwareUpdate';
import { NewsletterActionTypes } from '@onboarding-types/newsletter';
import { FetchActionTypes } from '@onboarding-types/fetch';
import { ConnectActionTypes } from '@onboarding-types/connect';
import { OnboardingActionTypes, OnboardingReducer } from '@onboarding-types/onboarding';

import { Action } from '@suite-types';

interface OnboardingAppState extends ReturnType<typeof onboarding> {
    connect?: ReturnType<typeof connect>;
    recovery?: ReturnType<typeof recovery>;
    firmwareUpdate?: ReturnType<typeof firmwareUpdate>;
    newsletter?: ReturnType<typeof newsletter>;
    activeStepId: OnboardingReducer['activeStepId'];
    activeSubStep: OnboardingReducer['activeSubStep'];
    selectedModel: OnboardingReducer['selectedModel'];
}

export default function onboardingApp(state: OnboardingAppState | undefined, action: Action) {
    const onboardingState: OnboardingAppState = onboarding(state, action as OnboardingActionTypes);
    return {
        activeStepId: onboardingState.activeStepId,
        activeSubStep: onboardingState.activeSubStep,
        selectedModel: onboardingState.selectedModel,
        path: onboardingState.path,
        connect: connect(
            onboardingState.connect,
            action as ConnectActionTypes,
        ),
        recovery: recovery(onboardingState.recovery, action as RecoveryActionTypes),
        firmwareUpdate: firmwareUpdate(
            onboardingState.firmwareUpdate,
            action as FirmwareUpdateActionTypes,
        ),
        newsletter: newsletter(onboardingState.newsletter, action as NewsletterActionTypes),
    };
}
