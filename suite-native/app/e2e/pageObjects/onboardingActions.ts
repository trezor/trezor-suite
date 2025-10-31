import { waitForVisible } from '../support/utils';
class OnOnboardingActions {
    async finishOnboarding() {
        const testId = '@onboarding/Welcome/nextBtn';
        await waitForVisible(by.id(testId), { timeout: 30000 });
        await element(by.id(testId)).tap();
        await element(by.id('@onboarding/AnalyticsConsent/nextBtn')).tap();
        await element(by.id('@onboarding/Biometrics/skipBtn')).tap();
    }
}

export const onOnboarding = new OnOnboardingActions();
