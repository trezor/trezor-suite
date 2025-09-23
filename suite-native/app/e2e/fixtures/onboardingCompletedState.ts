import { PreloadedState } from '@suite-native/state';

/**
 *  State fragment that ensures that the onboarding flow is not displayed after the first launch of the app.
 */
export const onboardingCompletedState: PreloadedState = {
    appSettings: {
        isOnboardingFinished: true,
    },
};
