import { expect as detoxExpect } from 'detox';

import { onAlertSheet } from './alertSheetActions';
import { waitForElementByIdToBeVisible } from '../utils';

const platform = device.getPlatform();

class OnOnboardingActions {
    async finishOnboarding() {
        const testId = '@onboarding/Welcome/nextBtn';
        await waitForElementByIdToBeVisible(testId, 20000);
        await element(by.id(testId)).tap();

        if (platform === 'android') {
            await element(by.id('@onboarding/ConnectTrezor/nextBtn')).tap();
        } else {
            await element(by.id('@onboarding/TrackBalances/nextBtn')).tap();
        }

        await element(by.id('@onboarding/AboutReceiveCoinsFeature/nextBtn')).tap();

        if (platform === 'android') {
            await element(by.id('@onboarding/TrackBalances/nextBtn')).tap();
        }

        await detoxExpect(element(by.id('@onboarding/UserDataConsent/allow'))).toBeVisible();
        await element(by.id('@onboarding/UserDataConsent/allow')).tap();

        try {
            await onAlertSheet.tapSecondaryButton();
        } catch {
            // Android emulator does not support biometrics, so the sheet is not displayed at all.
            console.warn(
                'Biometrics not supported by device, skipping close of biometrics bottom sheet.',
            );
        }
    }

    async skipOnboarding() {
        const testId = '@onboarding/e2eSkipOnboarding';
        await waitForElementByIdToBeVisible(testId, 20000);
        await element(by.id(testId)).tap();
    }
}

export const onOnboarding = new OnOnboardingActions();
