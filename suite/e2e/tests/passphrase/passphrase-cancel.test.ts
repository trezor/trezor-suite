import { TestStream } from '@trezor/e2e-utils';

import { test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Passphrase cancel', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all', passphrase_protection: true } });

    test(
        'possible to cancel passphrase',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ devicePrompt, onboardingPage, settingsPage, dashboardPage }) => {
            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({ enableNetworks: ['btc'] });

            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWalletButton.click();
            await dashboardPage.addExistingHiddenWalletButton.click();
            await dashboardPage.passphraseInput.fill('abc');
            await dashboardPage.passphraseSubmitButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();

            await devicePrompt.closeButton.click();
        },
    );
});
