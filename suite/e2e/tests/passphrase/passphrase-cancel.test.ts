import { test } from '../../support/fixtures';

test.describe('Passphrase cancel', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all', passphrase_protection: true } });

    test('possible to cancel passphrase', async ({
        devicePrompt,
        onboardingPage,
        settingsPage,
        dashboardPage,
    }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });

        await dashboardPage.deviceSwitchingOpenButton.click();
        await dashboardPage.addHiddenWalletButton.click();
        await dashboardPage.addExistingHiddenWalletButton.click();
        await dashboardPage.passphraseInput.fill('abc');
        await dashboardPage.passphraseSubmitButton.click();
        await devicePrompt.confirmOnDevicePromptIsShown();

        await devicePrompt.closeButton.click();
    });
});
