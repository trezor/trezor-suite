import { type OnboardingRootState } from 'src/reducers/onboarding/onboardingReducer';

export const selectOnboardingAnalytics = (state: OnboardingRootState) =>
    state.onboarding.onboardingAnalytics;
