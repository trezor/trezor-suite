import { combineReducers } from 'redux';

import onboarding from '@suite/reducers/onboarding/onboardingReducer';
import connect from '@suite/reducers/onboarding/connectReducer';
import fetch from '@suite/reducers/onboarding/fetchReducer';
import recovery from '@suite/reducers/onboarding/recoveryReducer';
import firmwareUpdate from '@suite/reducers/onboarding/firmwareUpdateReducer';
import newsletter from '@suite/reducers/onboarding/newsletterReducer';

export default function onboardingApp(state, action) {
    const onboardingState = onboarding(state, action);
    return {
        activeStepId: onboardingState.activeStepId,
        activeSubStep: onboardingState.activeSubStep,
        steps: onboardingState.steps,
        selectedModel: onboardingState.selectedModel,
        connect: connect(
            onboardingState.connect,
            action,
        ),
        fetch: fetch(onboardingState.fetch, action),
        recovery: recovery(onboardingState.recovery, action),
        firmwareUpdate: firmwareUpdate(onboardingState.firmwareUpdate, action),
        newsletter: newsletter(onboardingState.newsletter, action),
    };
}
