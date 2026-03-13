import { onboardingSlice } from './onboardingReducer';

export const {
    enableOnboardingReducer,
    goToOnboardingStep,
    addOnboardingPath,
    removeOnboardingPath,
    updateOnboardingAnalytics,
    updateOnboardingBackupType,
    resetOnboarding,
} = onboardingSlice.actions;
