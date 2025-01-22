import { waitForElementByIdToBeVisible } from '../utils';
class OnOnboardingActions {
    async finishOnboarding() {
        const testId = '@onboarding/Welcome/nextBtn';
        await waitForElementByIdToBeVisible(testId, 30000);
        await element(by.id(testId)).tap();

        await element(by.id('@onboarding/AnalyticsConsent/nextBtn')).tap();

        await element(by.id('@onboarding/Biometrics/skipBtn')).tap();
    }

    async skipOnboarding() {
        const testId = '@onboarding/e2eSkipOnboarding';
        await waitForElementByIdToBeVisible(testId, 20000);
        await element(by.id(testId)).tap();
    }
}

export const onOnboarding = new OnOnboardingActions();
