import { type OnboardingRootState } from '../../reducers/onboarding/onboardingReducer';

export const selectOnboarding = (state: OnboardingRootState) => state.onboarding;

export const selectOnboardingPath = (state: OnboardingRootState) => state.onboarding.path;

export const selectOnboardingActiveStepId = (state: OnboardingRootState) =>
    state.onboarding.activeStepId;

export const selectOnboardingAnalytics = (state: OnboardingRootState) =>
    state.onboarding.onboardingAnalytics;
