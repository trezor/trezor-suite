import { scrollUntilVisible } from '../utils';

const platform = device.getPlatform();

class OnOnboardingActions {
    async finishOnboarding() {
        await waitFor(element(by.id('@onboarding/Welcome/nextBtn')))
            .toBeVisible()
            .withTimeout(20000); // Debug build takes some time to load.

        await element(by.id('@onboarding/Welcome/nextBtn')).tap();

        if (platform === 'android') {
            await element(by.id('@onboarding/ConnectTrezor/nextBtn')).tap();
        } else {
            await element(by.id('@onboarding/TrackBalances/nextBtn')).tap();
        }

        await element(by.id('@onboarding/AboutReceiveCoinsFeature/nextBtn')).tap();

        if (platform === 'android') {
            await element(by.id('@onboarding/TrackBalances/nextBtn')).tap();
        }

        await scrollUntilVisible(by.id(`@onboarding/UserDataConsent/allow`));
        await element(by.id('@onboarding/UserDataConsent/allow')).tap();

        try {
            await element(by.id('reject-biometrics')).tap();
        } catch {
            // Android emulator does not support biometrics, so the sheet is not displayed at all.
            console.warn(
                'Biometrics not supported by device, skipping close of biometrics bottom sheet.',
            );
        }
    }
}

export const onOnboarding = new OnOnboardingActions();
